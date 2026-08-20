const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    excerpt: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    },
    content: {
        type: String,
        default: ""
    },
    featuredImage: {
        type: String,
        default: ""
    },
    images: [{
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimetype: String
    }],
    attachments: [{
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimetype: String
    }],
    category: {
        type: String,
        trim: true,
        default: "General"
    },
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft"
    },
    featured: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    showAuthor: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

newsSchema.index({ author: 1, createdAt: -1 });
newsSchema.index({ status: 1 });
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ status: 1, featured: 1 });
newsSchema.index({ status: 1, views: -1 });

module.exports = mongoose.model("News", newsSchema);
