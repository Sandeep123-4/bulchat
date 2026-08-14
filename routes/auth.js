const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Message = require("../models/Message");

const router = express.Router();

// Landing Page
router.get("/", (req, res) => {
    res.render("index");
});

// Login Page
router.get("/login", (req, res) => {
    res.render("login");
});

// Signup Page
router.get("/signup", (req, res) => {
    res.render("signup");
});

// Check if email already exists (used by signup form)
router.get("/api/check-email", async (req, res) => {
    try {
        const email = String(req.query.email || "").trim();

        if (!email) {
            return res.json({ exists: false });
        }

        const user = await User.findOne({ email });

        res.json({ exists: !!user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Signup
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) return res.send("Email already exists");

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.redirect("/");
    } catch (err) {
        res.send(err.message);
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user)
            return res.send("This email is not registered. Please sign up first.");

        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.send("Incorrect password");

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000
        });

        res.redirect("/dashboard");
    } catch (err) {
        res.send(err.message);
    }
});

router.post("/profile/update", async (req, res) => {
    try {

        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "Not logged in"
            });
        }

        // Verify cookie/JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Get user ID from verified cookie
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const newName = req.body.username?.trim();

        if (!newName) {
            return res.status(400).json({
                message: "Name cannot be empty"
            });
        }

        // Update MongoDB
        user.username = newName;

        await user.save();

        res.json({
            success: true,
            username: user.username
        });

    } catch (error) {

        console.error("PROFILE UPDATE ERROR:", error);

        res.status(401).json({
            message: "Invalid authentication"
        });
    }
});
// Profile picture upload
router.post("/api/profile/avatar", async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Not logged in" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { image } = req.body;

        if (!image || typeof image !== "string") {
            return res.status(400).json({ message: "No image provided" });
        }

        const match = image.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,(.+)$/);

        if (!match) {
            return res.status(400).json({ message: "Invalid image format" });
        }

        const ext = match[2] === "jpeg" ? "jpg" : match[2];
        const buffer = Buffer.from(match[3], "base64");

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

        if (buffer.length > MAX_SIZE) {
            return res.status(400).json({ message: "Image must be under 5MB" });
        }

        const uploadDir = path.join(__dirname, "..", "public", "uploads");

        fs.mkdirSync(uploadDir, { recursive: true });

        // Delete the previous uploaded avatar
        if (user.avatar) {
            try {
                fs.unlinkSync(path.join(uploadDir, user.avatar));
            } catch (e) {
                // ignore missing file
            }
        }

        const filename = `avatar-${user._id}-${Date.now()}.${ext}`;

        try {
            fs.writeFileSync(path.join(uploadDir, filename), buffer);
        } catch (e) {
            console.error("AVATAR WRITE ERROR:", e);

            return res.status(500).json({
                message: "Could not save image on the server"
            });
        }

        user.avatar = filename;

        await user.save();

        res.json({
            success: true,
            avatar: `/uploads/${filename}`
        });

    } catch (error) {
        console.error("AVATAR UPLOAD ERROR:", error);

        res.status(500).json({ message: error.message || "Upload failed" });
    }
});

// Dashboard
router.get("/dashboard", async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token)
            return res.redirect("/");

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        res.render("dashboard", { user });
    } catch {
        res.redirect("/");
    }
});

router.get("/chat", async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) return res.redirect("/login");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) return res.redirect("/login");

        // Premium check
        if (!user.premium) {
            return res.send("Buy Premium to access the chat room.");
            // or: return res.redirect("/dashboard");
        }

        // Load the last 100 messages from MongoDB
        const messages = await Message.find()
            .sort({ createdAt: 1 })
            .limit(100);

        res.render("chat", {
            user,
            messages
        });

    } catch (err) {
        console.error(err);
        res.redirect("/login");
    }
});

// Logout
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

module.exports = router;