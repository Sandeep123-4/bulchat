const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/user");
const News = require("../models/News");

const router = express.Router();

const NEWS_IMAGES_DIR = path.join(__dirname, "..", "public", "uploads", "news", "images");
const NEWS_ATTACH_DIR = path.join(__dirname, "..", "public", "uploads", "news", "attachments");

fs.mkdirSync(NEWS_IMAGES_DIR, { recursive: true });
fs.mkdirSync(NEWS_ATTACH_DIR, { recursive: true });

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain"
];
const BLOCKED_EXTENSIONS = [".exe", ".bat", ".cmd", ".sh", ".php", ".msi", ".js", ".ps1", ".vbs", ".com", ".scr", ".pif", ".jar", ".wsf", ".cpl"];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOC_SIZE = 20 * 1024 * 1024;
const MAX_IMAGES = 10;
const MAX_ATTACHMENTS = 5;

function safeFilename(original) {
    const ext = path.extname(original).toLowerCase();
    const base = path.basename(original, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_{2,}/g, "_")
        .substring(0, 80);
    return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${base}${ext}`;
}

function blockedExt(filename) {
    const ext = path.extname(filename).toLowerCase();
    return BLOCKED_EXTENSIONS.includes(ext);
}

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, NEWS_IMAGES_DIR),
    filename: (req, file, cb) => cb(null, safeFilename(file.originalname))
});

const docStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, NEWS_ATTACH_DIR),
    filename: (req, file, cb) => cb(null, safeFilename(file.originalname))
});

const uploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: (req, file, cb) => {
        if (blockedExt(file.originalname)) {
            return cb(new Error("File type not allowed"));
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG, WEBP images are allowed"));
        }
        cb(null, true);
    }
});

const uploadDoc = multer({
    storage: docStorage,
    limits: { fileSize: MAX_DOC_SIZE },
    fileFilter: (req, file, cb) => {
        if (blockedExt(file.originalname)) {
            return cb(new Error("File type not allowed"));
        }
        if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
            return cb(new Error("File type not allowed"));
        }
        cb(null, true);
    }
});

function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        res.redirect("/login");
    }
}

function stripHtml(html) {
    if (!html) return "";
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function sanitizeHtml(html) {
    if (!html) return "";
    let clean = html;
    clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    clean = clean.replace(/on\w+\s*=\s*[^\s>]+/gi, "");
    clean = clean.replace(/javascript\s*:/gi, "");
    clean = clean.replace(/data\s*:/gi, "data-safe:");
    return clean;
}

function deleteFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (e) { /* ignore */ }
}

function cleanupPostFiles(post) {
    if (post.featuredImage) {
        deleteFile(path.join(NEWS_IMAGES_DIR, path.basename(post.featuredImage)));
    }
    if (post.images && post.images.length) {
        post.images.forEach(img => deleteFile(path.join(NEWS_IMAGES_DIR, path.basename(img.filename))));
    }
    if (post.attachments && post.attachments.length) {
        post.attachments.forEach(att => deleteFile(path.join(NEWS_ATTACH_DIR, path.basename(att.filename))));
    }
}

// GET /post-news - Render the page
router.get("/post-news", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.redirect("/login");
        res.render("post-news", { user });
    } catch (err) {
        console.error("Post News page error:", err);
        res.redirect("/login");
    }
});

// POST /api/news - Create or update a post
router.post("/api/news", authMiddleware, async (req, res) => {
    try {
        const { postId, title, excerpt, content, category, tags, status, featuredImage, images, attachments, featured, showAuthor } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: "Title is required" });
        }

        const sanitizedContent = sanitizeHtml(content || "");
        const parsedTags = tags
            ? (Array.isArray(tags) ? tags : String(tags).split(",").map(t => t.trim()).filter(Boolean))
            : [];

        const validStatus = ["draft", "published"].includes(status) ? status : "draft";

        if (postId) {
            const existing = await News.findById(postId);
            if (!existing) return res.status(404).json({ error: "Post not found" });
            if (String(existing.author) !== String(req.userId)) {
                return res.status(403).json({ error: "Not authorized" });
            }

            existing.title = title.trim();
            existing.excerpt = (excerpt || "").trim().substring(0, 500);
            existing.content = sanitizedContent;
            existing.category = (category || "General").trim();
            existing.tags = parsedTags;
            existing.featured = !!featured;
            existing.showAuthor = !!showAuthor;

            if (featuredImage !== undefined) {
                existing.featuredImage = featuredImage;
            }
            if (Array.isArray(images)) {
                existing.images = images;
            }
            if (Array.isArray(attachments)) {
                existing.attachments = attachments;
            }
            if (validStatus === "published" && existing.status !== "published") {
                existing.publishedAt = new Date();
            }
            existing.status = validStatus;

            await existing.save();
            return res.json({ success: true, post: existing, message: "Post updated" });
        }

        const post = await News.create({
            author: req.userId,
            title: title.trim(),
            excerpt: (excerpt || "").trim().substring(0, 500),
            content: sanitizedContent,
            featuredImage: featuredImage || "",
            images: Array.isArray(images) ? images : [],
            attachments: Array.isArray(attachments) ? attachments : [],
            category: (category || "General").trim(),
            tags: parsedTags,
            status: validStatus,
            featured: !!featured,
            showAuthor: !!showAuthor,
            publishedAt: validStatus === "published" ? new Date() : null
        });

        res.json({ success: true, post, message: "Post created" });
    } catch (err) {
        console.error("Create/update post error:", err);
        res.status(500).json({ error: "Failed to save post" });
    }
});

// GET /api/news/mine - Get current user's posts
router.get("/api/news/mine", authMiddleware, async (req, res) => {
    try {
        const { filter } = req.query;
        const query = { author: req.userId };
        if (filter === "published") query.status = "published";
        else if (filter === "draft") query.status = "draft";

        const posts = await News.find(query)
            .sort({ updatedAt: -1 })
            .select("title excerpt featuredImage category status tags featured views createdAt updatedAt publishedAt");

        res.json({ success: true, posts });
    } catch (err) {
        console.error("Fetch posts error:", err);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

// GET /api/news/:id - Get a single post
router.get("/api/news/:id", authMiddleware, async (req, res) => {
    try {
        const post = await News.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (String(post.author) !== String(req.userId)) {
            return res.status(403).json({ error: "Not authorized" });
        }
        res.json({ success: true, post });
    } catch (err) {
        console.error("Fetch post error:", err);
        res.status(500).json({ error: "Failed to fetch post" });
    }
});

// DELETE /api/news/:id - Delete a post
router.delete("/api/news/:id", authMiddleware, async (req, res) => {
    try {
        const post = await News.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (String(post.author) !== String(req.userId)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        cleanupPostFiles(post);
        await News.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: "Post deleted" });
    } catch (err) {
        console.error("Delete post error:", err);
        res.status(500).json({ error: "Failed to delete post" });
    }
});

// POST /api/news/upload/featured - Upload featured image
router.post("/api/news/upload/featured", authMiddleware, (req, res) => {
    uploadImage.single("image")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ error: "Image must be under 5MB" });
                }
            }
            return res.status(400).json({ error: err.message || "Upload failed" });
        }
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        res.json({
            success: true,
            file: {
                filename: req.file.filename,
                path: `/uploads/news/images/${req.file.filename}`,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    });
});

// POST /api/news/upload/images - Upload additional images
router.post("/api/news/upload/images", authMiddleware, (req, res) => {
    uploadImage.array("images", MAX_IMAGES)(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ error: "Each image must be under 5MB" });
                }
                if (err.code === "LIMIT_UNEXPECTED_FILE") {
                    return res.status(400).json({ error: `Maximum ${MAX_IMAGES} images allowed` });
                }
            }
            return res.status(400).json({ error: err.message || "Upload failed" });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const files = req.files.map(f => ({
            filename: f.filename,
            path: `/uploads/news/images/${f.filename}`,
            originalName: f.originalname,
            size: f.size,
            mimetype: f.mimetype
        }));

        res.json({ success: true, files });
    });
});

// POST /api/news/upload/attachments - Upload file attachments
router.post("/api/news/upload/attachments", authMiddleware, (req, res) => {
    uploadDoc.array("attachments", MAX_ATTACHMENTS)(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ error: "Each file must be under 20MB" });
                }
                if (err.code === "LIMIT_UNEXPECTED_FILE") {
                    return res.status(400).json({ error: `Maximum ${MAX_ATTACHMENTS} attachments allowed` });
                }
            }
            return res.status(400).json({ error: err.message || "Upload failed" });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const files = req.files.map(f => ({
            filename: f.filename,
            path: `/uploads/news/attachments/${f.filename}`,
            originalName: f.originalname,
            size: f.size,
            mimetype: f.mimetype
        }));

        res.json({ success: true, files });
    });
});

// POST /api/news/delete-file - Remove an uploaded file from a post
router.post("/api/news/delete-file", authMiddleware, async (req, res) => {
    try {
        const { postId, fileType, filename } = req.body;

        if (postId) {
            const post = await News.findById(postId);
            if (!post || String(post.author) !== String(req.userId)) {
                return res.status(403).json({ error: "Not authorized" });
            }
        }

        const dir = fileType === "attachment" ? NEWS_ATTACH_DIR : NEWS_IMAGES_DIR;
        const safeName = path.basename(filename || "");
        if (!safeName || safeName.includes("..") || safeName.includes("/")) {
            return res.status(400).json({ error: "Invalid filename" });
        }

        deleteFile(path.join(dir, safeName));
        res.json({ success: true });
    } catch (err) {
        console.error("Delete file error:", err);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

module.exports = router;
