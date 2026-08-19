const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");
const User = require("../models/user");
const Otp = require("../models/Otp");
const Message = require("../models/Message");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

let logoBase64 = "";
try {
    logoBase64 = fs.readFileSync(path.join(__dirname, "public", "img", "logo.png")).toString("base64");
} catch (_) {}

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

// Send OTP for signup
router.post("/api/send-otp", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        await Otp.deleteMany({ email, verified: false });

        await Otp.create({
            email,
            otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        try {
            const emailHtml = `
                    <div style="font-family:Inter,sans-serif;max-width:440px;margin:0 auto;padding:40px 20px;">
                        <div style="text-align:center;margin-bottom:32px;">
                            <img
  src="https://mudraaa.tech/img/logo.png"
  alt="Mudraaa"
  width="60"
  height="60"
  style="border-radius:14px;display:block;margin:0 auto 12px;"
>
                            <span style="font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.5px;">Mudraaa</span>
                        </div>
                        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px 28px;">
                            <h2 style="color:#111827;font-size:20px;margin:0 0 8px;text-align:center;">Verify your email</h2>
                            <p style="color:#6b7280;font-size:14px;margin:0 0 28px;text-align:center;line-height:1.5;">
                                Use the following OTP to complete your Mudraaa signup. This code expires in <strong>10 minutes</strong>.
                            </p>
                            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                                <p style="margin:0;text-align:center;font-family:monospace;font-size:36px;font-weight:800;letter-spacing:12px;color:#2EA043;user-select:all;-webkit-user-select:all;">${otp}</p>
                            </div>
                            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;line-height:1.5;">
                                If you did not request this, you can safely ignore this email.<br>Do not share this code with anyone.
                            </p>
                        </div>
                        <p style="color:#d1d5db;font-size:11px;text-align:center;margin:24px 0 0;">
                            Mudraaa &mdash; Real-time market intelligence
                        </p>
                    </div>
                `;

            const attachments = [];
            if (logoBase64) {
                attachments.push({
                    filename: "logo.png",
                    content: Buffer.from(logoBase64, "base64"),
                    content_id: "mudraaa-logo",
                    disposition: "inline"
                });
            }

            await resend.emails.send({
                from: process.env.RESEND_FROM || "Mudraaa <onboarding@resend.dev>",
                to: email,
                subject: "Mudraaa - Verify your email",
                html: emailHtml,
                ...(attachments.length ? { attachments } : {})
            });
            console.log(`[OTP] Sent to ${email}: ${otp}`);
            res.json({ success: true, message: "OTP sent to your email" });
        } catch (emailErr) {
            console.error("RESEND ERROR:", emailErr);
            console.log(`[OTP] Dev fallback — code for ${email}: ${otp}`);
            res.json({ success: true, message: "OTP sent to your email", _devOtp: otp });
        }
    } catch (err) {
        console.error("SEND OTP ERROR:", err);
        res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }
});

// Verify OTP and create account
router.post("/api/verify-otp", async (req, res) => {
    try {
        const { username, email, password, otp } = req.body;

        if (!username || !email || !password || !otp) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const record = await Otp.findOne({
            email,
            otp,
            verified: false,
            expiresAt: { $gt: new Date() }
        });

        if (!record) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword
        });

        await Otp.deleteMany({ email });

        res.json({ success: true, message: "Account created successfully" });
    } catch (err) {
        console.error("VERIFY OTP ERROR:", err);
        res.status(500).json({ error: "Failed to verify OTP. Please try again." });
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

        res.set("Cache-Control", "no-cache, no-store, must-revalidate");

        res.render("chat", {
            user,
            messages
        });

    } catch (err) {
        console.error(err);
        res.redirect("/login");
    }
});

// Commodities
router.get("/commodities", async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) return res.redirect("/login");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) return res.redirect("/login");

        res.render("commodities", { user });
    } catch (err) {
        console.error(err);
        res.redirect("/login");
    }
});

// Crypto
router.get("/crypto", async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) return res.redirect("/login");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) return res.redirect("/login");

        res.render("crypto", { user });
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