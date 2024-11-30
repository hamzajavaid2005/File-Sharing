import React, { useState, useEffect } from 'react';
import { FiUpload, FiFile, FiShare2, FiDownload, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import { isAuthenticated } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedFileForShare, setSelectedFileForShare] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        // Check authentication on component mount
        if (!isAuthenticated()) {
            toast.error('Please log in to access the dashboard');
            navigate('/login');
            return;
        }

        // Fetch files
        fetchFiles();
    }, [navigate]);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (100MB limit)
            const maxSize = 100 * 1024 * 1024; // 100MB in bytes
            if (file.size > maxSize) {
                toast.error('File size too large. Maximum size is 100MB');
                event.target.value = ''; // Reset file input
                return;
            }
            setSelectedFile(file);
            setUploadProgress(0);
            console.log('Selected file:', {
                name: file.name,
                size: file.size,
                type: file.type
            });
        }
    };

    const handleUpload = async () => {
        if (!isAuthenticated()) {
            toast.error('Please log in to upload files');
            navigate('/login');
            return;
        }

        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await api.post('/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                    if (percentCompleted === 100) {
                        toast.loading('Processing file...');
                    }
                },
            });

            console.log('Upload successful:', response.data);
            
            // Add the new file to the files list
            if (response.data?.data?.file) {
                setFiles(prevFiles => [response.data.data.file, ...prevFiles]);
                setSelectedFile(null);
                toast.success('File uploaded successfully!');
                // Reset file input
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) {
                    fileInput.value = '';
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Upload error:', error);
            
            // Clear any loading toasts
            toast.dismiss();
            
            if (error.message === 'Please log in to continue') {
                navigate('/login');
            }
            
            // Handle specific error messages
            const errorMessage = error.response?.data?.message 
                || error.message 
                || 'Failed to upload file';
            
            toast.error(errorMessage);

            // Reset file input on error
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.value = '';
            }
            setSelectedFile(null);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const fetchFiles = async () => {
        if (!isAuthenticated()) {
            return;
        }

        try {
            const response = await api.get('/all');
            console.log('Fetched files:', response.data);
            setFiles(response.data.data || []);
        } catch (error) {
            console.error('Error fetching files:', error);
            if (error.message === 'Please log in to continue') {
                navigate('/login');
            } else {
                toast.error('Failed to fetch files');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fileId) => {
        try {
            await api.delete(`/delete/${fileId}`);
            setFiles(files.filter(file => file._id !== fileId));
            toast.success('File deleted successfully!');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete file');
        }
    };

    const handleShare = (file) => {
        setSelectedFileForShare(file);
        setShareModalOpen(true);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex justify-center bg-gray-50">
            <div className="w-[90%] h-full p-4">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Upload, manage and share your files
                    </p>
                </div>

                {/* File Upload Section */}
                <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>
                    <div className="flex items-center space-x-4">
                        <label className="flex-1">
                            <input
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="*/*"
                                disabled={uploading}
                            />
                            <div className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer">
                                <FiUpload className="mr-2" />
                                <span className="text-gray-600">
                                    {selectedFile ? selectedFile.name : 'Choose a file'}
                                </span>
                            </div>
                        </label>
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploading}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? `Uploading... (${uploadProgress}%)` : 'Upload'}
                        </button>
                    </div>
                </div>

                {/* Files List */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Your Files</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        File
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Size
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Uploaded
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {files.map((file) => (
                                    <tr key={file._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FiFile className="mr-2" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {file.name || file.originalname || file.fileName || 'Unnamed File'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatFileSize(file.size)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(file.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleShare(file)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                    title="Share"
                                                >
                                                    <FiShare2 />
                                                </button>
                                                <button
                                                    onClick={() => window.open(file.url)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Download"
                                                >
                                                    <FiDownload />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(file._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {files.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            No files uploaded yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Share Modal */}
                {shareModalOpen && selectedFileForShare && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4">Share File</h3>
                            <p className="mb-4">Share link for: {selectedFileForShare.originalname || selectedFileForShare.fileName}</p>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={selectedFileForShare.url}
                                    readOnly
                                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(selectedFileForShare.url);
                                        toast.success('Link copied to clipboard');
                                    }}
                                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                >
                                    Copy
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setShareModalOpen(false);
                                    setSelectedFileForShare(null);
                                }}
                                className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
