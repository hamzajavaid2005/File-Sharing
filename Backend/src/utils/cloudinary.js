import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError.js';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { promisify } from 'util';
import stream from 'stream';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pipeline = promisify(stream.pipeline);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
    const requiredVars = [
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('Missing Cloudinary configuration:', {
            missing: missingVars,
            available: {
                CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'not set',
                CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'set' : 'not set',
                CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'set' : 'not set'
            }
        });
        throw new ApiError(
            500,
            `Missing required Cloudinary configuration: ${missingVars.join(', ')}`
        );
    }

    return {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    };
};

// Configure Cloudinary
const cloudinaryConfig = validateCloudinaryConfig();
cloudinary.config(cloudinaryConfig);
console.log('Cloudinary configured with cloud name:', cloudinaryConfig.cloud_name);

// Helper function to create temp directory if it doesn't exist
const createTempDirIfNotExists = async (subDir = '') => {
    try {
        const baseDir = path.join(os.tmpdir(), 'file-sharing-uploads');
        const fullPath = subDir ? path.join(baseDir, subDir) : baseDir;
        
        if (!fs.existsSync(fullPath)) {
            await mkdir(fullPath, { recursive: true });
        }
        return fullPath;
    } catch (error) {
        console.error('Error creating temp directory:', error);
        throw new ApiError(500, 'Failed to create temporary directory for file processing');
    }
};

// Helper function to get file metadata using FFmpeg
const getVideoMetadata = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                console.error('FFmpeg probe error:', err);
                reject(new ApiError(500, 'Failed to get video metadata'));
            }
            resolve(metadata);
        });
    });
};

// Helper function to get file extension
const getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase();
};

// Helper function to check if file is video
const isVideo = (filename) => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'];
    return videoExtensions.includes(getFileExtension(filename));
};

// Convert video to HLS format
const convertToHLS = async (inputPath, outputDir, options = {}) => {
    const {
        segmentDuration = 10,
        maxWidth = 1280,
        fps = 30
    } = options;

    // Create output directory for HLS files
    if (!fs.existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
    }

    const qualities = [
        { name: '1080p', width: 1920, bitrate: '5000k' },
        { name: '720p', width: 1280, bitrate: '2800k' },
        { name: '480p', width: 854, bitrate: '1400k' },
        { name: '360p', width: 640, bitrate: '800k' }
    ];

    const masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n';
    const variantStreams = [];
    const conversionPromises = [];

    // Get video metadata for aspect ratio calculation
    const metadata = await getVideoMetadata(inputPath);
    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    const aspectRatio = videoStream.width / videoStream.height;

    for (const quality of qualities) {
        // Skip qualities higher than original video
        if (quality.width > videoStream.width) continue;

        const height = Math.floor(quality.width / aspectRatio);
        const outputPath = path.join(outputDir, `${quality.name}`);
        const playlistName = `${quality.name}.m3u8`;

        const promise = new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    '-profile:v main',
                    '-sc_threshold 0',
                    '-g 48',
                    '-keyint_min 48',
                    '-hls_time ' + segmentDuration,
                    '-hls_playlist_type vod',
                    '-hls_segment_filename ' + path.join(outputPath, 'segment_%03d.ts')
                ])
                .outputOption('-hls_list_size 0')
                .outputOption('-f hls')
                .addOption('-c:v', 'libx264')
                .addOption('-c:a', 'aac')
                .addOption('-b:v', quality.bitrate)
                .addOption('-b:a', '128k')
                .size(`${quality.width}x${height}`)
                .fps(fps)
                .output(path.join(outputPath, playlistName))
                .on('end', () => resolve(playlistName))
                .on('error', (err) => reject(err))
                .run();
        });

        conversionPromises.push(promise);
        variantStreams.push(`#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(quality.bitrate) * 1000},RESOLUTION=${quality.width}x${height}\n${quality.name}/${playlistName}`);
    }

    try {
        // Wait for all conversions to complete
        await Promise.all(conversionPromises);

        // Write master playlist
        const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
        fs.writeFileSync(masterPlaylistPath, masterPlaylist + variantStreams.join('\n'));

        return {
            masterPlaylist: masterPlaylistPath,
            outputDir
        };
    } catch (error) {
        console.error('Error in HLS conversion:', error);
        throw new ApiError(500, 'Failed to convert video to HLS format');
    }
};

// Upload directory to Cloudinary
const uploadDirectoryToCloudinary = async (directory, options = {}) => {
    try {
        const files = await readdir(directory, { recursive: true });
        const uploadPromises = [];

        for (const file of files) {
            const filePath = path.join(directory, file);
            if (fs.statSync(filePath).isFile()) {
                const uploadPromise = cloudinary.uploader.upload(filePath, {
                    ...options,
                    resource_type: 'auto',
                    use_filename: true,
                    unique_filename: true
                });
                uploadPromises.push(uploadPromise);
            }
        }

        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error('Error uploading directory to Cloudinary:', error);
        throw new ApiError(500, 'Failed to upload HLS files to Cloudinary');
    }
};

// Process video using FFmpeg with HLS support
export const processVideo = async (inputPath, outputDir, options = {}) => {
    try {
        console.log('Starting video processing with HLS conversion:', {
            input: inputPath,
            outputDir,
            options
        });

        const hlsResult = await convertToHLS(inputPath, outputDir, options);
        console.log('HLS conversion completed:', hlsResult);

        return hlsResult;
    } catch (error) {
        console.error('Error in video processing:', error);
        throw new ApiError(500, 'Failed to process video');
    }
};

// Upload file to Cloudinary
export const uploadToCloudinary = async (fileOrPath) => {
    let tempFilePath = null;
    let hlsOutputDir = null;
    
    try {
        console.log('Starting file upload to Cloudinary:', {
            type: typeof fileOrPath,
            isString: typeof fileOrPath === 'string',
            path: typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.path,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME
        });

        // Validate Cloudinary config again before upload
        validateCloudinaryConfig();

        const tempDir = await createTempDirIfNotExists();
        let originalname;

        // Handle both file path string and file object
        if (typeof fileOrPath === 'string') {
            tempFilePath = fileOrPath;
            originalname = path.basename(fileOrPath);
        } else if (fileOrPath?.path) {
            tempFilePath = fileOrPath.path;
            originalname = fileOrPath.originalname || path.basename(fileOrPath.path);
        } else {
            throw new ApiError(400, 'Invalid file input');
        }

        // Validate file exists and is readable
        try {
            await fs.promises.access(tempFilePath, fs.constants.R_OK);
            const stats = await fs.promises.stat(tempFilePath);
            if (stats.size === 0) {
                throw new ApiError(400, 'File is empty');
            }
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(400, `File not accessible: ${error.message}`);
        }

        let uploadResult;

        // If it's a video, process it with HLS
        if (isVideo(originalname)) {
            console.log('Processing video file for HLS:', {
                originalname,
                tempFilePath,
                exists: fs.existsSync(tempFilePath),
                size: fs.statSync(tempFilePath).size
            });

            try {
                // Create a unique directory for HLS files
                const hlsDir = `hls_${Date.now()}`;
                hlsOutputDir = await createTempDirIfNotExists(hlsDir);

                // Get video metadata first
                const metadata = await getVideoMetadata(tempFilePath);
                console.log('Video metadata:', metadata);

                if (!metadata?.streams?.[0]) {
                    throw new ApiError(400, 'Invalid video file or unable to read video metadata');
                }

                // Convert to HLS
                const hlsResult = await processVideo(tempFilePath, hlsOutputDir, {
                    maxWidth: 1920,
                    fps: metadata.streams[0].r_frame_rate ? 
                        Math.min(parseInt(eval(metadata.streams[0].r_frame_rate)), 30) : 30,
                    segmentDuration: 10
                });

                // Upload all HLS files to Cloudinary
                const results = await uploadDirectoryToCloudinary(hlsOutputDir, {
                    folder: `file-sharing/hls/${path.parse(originalname).name}`,
                    resource_type: 'auto'
                });

                if (!results || results.length === 0) {
                    throw new ApiError(500, 'Failed to upload HLS files to Cloudinary');
                }

                // Get the master playlist URL
                const masterPlaylist = results.find(r => r.original_filename.includes('master'));
                if (!masterPlaylist) {
                    throw new ApiError(500, 'Master playlist not found in upload results');
                }
                
                uploadResult = {
                    url: masterPlaylist.secure_url,
                    publicId: masterPlaylist.public_id,
                    resourceType: 'video',
                    format: 'hls',
                    size: results.reduce((acc, r) => acc + r.bytes, 0),
                    width: metadata.streams[0].width || 1920,
                    height: metadata.streams[0].height || 1080,
                    duration: metadata.format.duration,
                    thumbnailUrl: results[0].thumbnail_url,
                    hlsUrls: results.map(r => ({
                        url: r.secure_url,
                        publicId: r.public_id,
                        type: r.original_filename.includes('master') ? 'master' : 'segment'
                    }))
                };
            } catch (processError) {
                console.error('HLS conversion error:', processError);
                if (processError instanceof ApiError) throw processError;
                throw new ApiError(500, `Failed to convert video to HLS format: ${processError.message}`);
            }
        } else {
            // For non-video files, upload directly
            try {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream({
                        resource_type: 'auto',
                        folder: 'file-sharing',
                        use_filename: true,
                        unique_filename: true,
                        overwrite: true
                    }, (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject(new ApiError(500, `Cloudinary upload failed: ${error.message}`));
                        } else {
                            resolve(result);
                        }
                    });

                    const fileStream = fs.createReadStream(tempFilePath);
                    fileStream.pipe(uploadStream);

                    fileStream.on('error', (error) => {
                        reject(new ApiError(500, `File read error: ${error.message}`));
                    });
                });

                uploadResult = {
                    url: result.secure_url,
                    publicId: result.public_id,
                    resourceType: result.resource_type,
                    format: result.format,
                    size: result.bytes,
                    width: result.width,
                    height: result.height,
                    duration: result.duration,
                    thumbnailUrl: result.thumbnail_url
                };
            } catch (uploadError) {
                if (uploadError instanceof ApiError) throw uploadError;
                throw new ApiError(500, `Upload failed: ${uploadError.message}`);
            }
        }

        console.log('Upload successful:', {
            url: uploadResult.url,
            resourceType: uploadResult.resourceType,
            format: uploadResult.format
        });

        return uploadResult;
    } catch (error) {
        console.error('Upload error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Failed to upload file to Cloudinary: ${error.message}`);
    } finally {
        // Clean up temp files
        try {
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            if (hlsOutputDir && fs.existsSync(hlsOutputDir)) {
                fs.rmSync(hlsOutputDir, { recursive: true, force: true });
            }
        } catch (cleanupError) {
            console.error('Error cleaning up temporary files:', cleanupError);
        }
    }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new ApiError(500, `Failed to delete file from Cloudinary: ${error.message}`);
    }
};
