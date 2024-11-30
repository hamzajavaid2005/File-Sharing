import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        format: {
            type: String,
            required: true
        },
        resourceType: {
            type: String,
            required: true,
            enum: ['image', 'video', 'raw', 'auto']
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        duration: {
            type: Number,
            required: false
        },
        width: {
            type: Number,
            required: false
        },
        height: {
            type: Number,
            required: false
        },
        thumbnailUrl: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: ['processing', 'ready', 'error'],
            default: 'ready'
        },
        mimeType: {
            type: String,
            required: false
        },
        isHLS: {
            type: Boolean,
            default: false
        },
        hlsStreams: [{
            quality: String,
            url: String,
            public_id: String,
            width: Number,
            height: Number,
            bitrate: String
        }],
        masterPlaylistUrl: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Add index for better query performance
fileSchema.index({ owner: 1, createdAt: -1 });
fileSchema.index({ public_id: 1 });

// Virtual for file type
fileSchema.virtual('fileType').get(function() {
    if (this.resourceType === 'video') return 'video';
    if (this.resourceType === 'image') return 'image';
    return 'document';
});

const File = mongoose.model("File", fileSchema);

export { File };
