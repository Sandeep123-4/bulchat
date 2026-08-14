const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

const router = express.Router();

// Login Page
router.get("/", (req, res) => {
    res.render("login");
});

// Signup Page
router.get("/signup", (req, res) => {
    res.render("signup");
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
            return res.send("Invalid credentials");

        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.send("Invalid credentials");

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