const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Resend } = require("resend");
const User = require("../models/user");
const Otp = require("../models/Otp");
const Message = require("../models/Message");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// Larger body limit only for the avatar upload route (base64 image ≈ 5MB × 4/3).
const avatarJsonParser = express.json({ limit: "8mb" });

let logoBase64 = "";
try {
    logoBase64 = fs.readFileSync(path.join(__dirname, "public", "img", "logo.png")).toString("base64");
} catch (_) {}

// Landing Page - Cached news for fast initial load
const { cacheGet: getCache, cacheSet: setCache } = (() => {
    const _c = new Map();
    return {
        cacheGet(k) { const e = _c.get(k); if (!e) return null; if (Date.now() > e.x) { _c.delete(k); return null; } return e.d; },
        cacheSet(k, d, t) { _c.set(k, { d, x: Date.now() + t }); }
    };
})();

router.get("/", async (req, res) => {
    try {
        const News = require("../models/News");
        const now = Date.now();
        const windowMs = 15 * 24 * 60 * 60 * 1000;
        const windowStart = new Date(now - windowMs);

        // Use a limit on the query itself instead of fetching all published posts
        const eligible = await News.find({
            status: "published",
            publishedAt: { $gte: windowStart }
        })
            .select("title excerpt featuredImage category views publishedAt showAuthor author")
            .populate("author", "username")
            .sort({ publishedAt: -1 })
            .limit(50)
            .lean();

        const maxViews = eligible.reduce((max, p) => Math.max(max, p.views || 0), 0);

        eligible.forEach(p => {
            const ageHours = Math.max((now - new Date(p.publishedAt).getTime()) / (1000 * 60 * 60), 0);
            const freshness = 1 / (1 + ageHours / 24);
            const views = p.views || 0;
            const viewScore = maxViews > 0 ? views / maxViews : 0;
            p._score = Math.round((freshness * 0.7 + viewScore * 0.3) * 100) / 100;

            if (!p.showAuthor) {
                p.author = null;
            } else if (p.author) {
                p._authorName = p.author.username || "";
                p.author = null;
            }
            if (!p.featuredImage) p.featuredImage = "";
            const d = new Date(p.publishedAt);
            p._date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        });

        eligible.sort((a, b) => b._score - a._score);
        const topNews = eligible.slice(0, 10);

        res.render("index", { topNews });
    } catch (err) {
        console.error("Landing page news error:", err);
        res.render("index", { topNews: [] });
    }
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
                    <div style="font-family:Inter,sans-serif;width:100%;margin:0 auto;padding:4px 2px;">
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
                        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:3px 2px;">
                            <h2 style="color:#111827;font-size:20px;margin:0 0 8px;text-align:center;">Verify your email</h2>
                            <p style="color:#6b7280;font-size:14px;margin:0 0 28px;text-align:center;line-height:1.5;">
                                Use the following OTP to complete your Mudraaa signup. This code expires in <strong>10 minutes</strong>.
                            </p>
                            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:2px 2px;margin-bottom:28px;">
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

        try {
            const welcomeHtml = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background:#f4f5f7;font-family:Inter,Helvetica,Arial,sans-serif;">
                <div style="width:100%;margin:0 auto;padding:4px 2px;">

                    <!-- Header -->
                    <div style="text-align:center;margin-bottom:36px;">
                        <img src="https://mudraaa.tech/img/logo.png" alt="Mudraaa" width="56" height="56" style="border-radius:14px;display:block;margin:0 auto 14px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
                        <span style="font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Mudraaa</span>
                    </div>

                    <!-- Main Card -->
                    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:4px 3px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">

                        <!-- Welcome Banner -->
                        <div style="background:linear-gradient(135deg,#2EA043 0%,#1a7a30 100%);border-radius:12px;padding:28px 24px;text-align:center;margin-bottom:32px;">
                            <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px;">Welcome to Mudraaa!</h1>
                            <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">We're glad to have you with us</p>
                        </div>

                        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">
                            Hi <strong>${username}</strong>,
                        </p>
                        <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 32px;">
                            Thank you for joining Mudraaa. You now have access to Nepal's stock market data, alerts, and community — all in one place.
                        </p>

                        <!-- Features Section -->
                        <div style="margin-bottom:32px;">
                            <h3 style="color:#111827;font-size:15px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">What you can do</h3>

                            <!-- Feature 1 -->
                            <div style="background:#f9fafb;border:1px solid #f0f0f0;border-radius:10px;padding:16px 18px;margin-bottom:10px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                                    <td width="40" valign="top" style="padding-right:14px;">
                                        <div style="width:36px;height:36px;background:#e8f5e9;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">📈</div>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0 0 2px;color:#111827;font-size:14px;font-weight:600;">NEPSE Market Data</p>
                                        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Track live market info, stock prices, and key movements.</p>
                                    </td>
                                </tr></table>
                            </div>

                            <!-- Feature 2 -->
                            <div style="background:#f9fafb;border:1px solid #f0f0f0;border-radius:10px;padding:16px 18px;margin-bottom:10px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                                    <td width="40" valign="top" style="padding-right:14px;">
                                        <div style="width:36px;height:36px;background:#fff3e0;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">🔔</div>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0 0 2px;color:#111827;font-size:14px;font-weight:600;">Stock Alerts</p>
                                        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Get notified about important stock and market updates.</p>
                                    </td>
                                </tr></table>
                            </div>

                            <!-- Feature 3 -->
                            <div style="background:#f9fafb;border:1px solid #f0f0f0;border-radius:10px;padding:16px 18px;margin-bottom:10px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                                    <td width="40" valign="top" style="padding-right:14px;">
                                        <div style="width:36px;height:36px;background:#e3f2fd;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">💬</div>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0 0 2px;color:#111827;font-size:14px;font-weight:600;">Chat & Community</p>
                                        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Connect and discuss the Nepal stock market with others.</p>
                                    </td>
                                </tr></table>
                            </div>

                            <!-- Feature 4 -->
                            <div style="background:#f9fafb;border:1px solid #f0f0f0;border-radius:10px;padding:16px 18px;margin-bottom:10px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                                    <td width="40" valign="top" style="padding-right:14px;">
                                        <div style="width:36px;height:36px;background:#f3e5f5;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">📰</div>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0 0 2px;color:#111827;font-size:14px;font-weight:600;">Market Updates</p>
                                        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Stay up to date with Nepal stock market news.</p>
                                    </td>
                                </tr></table>
                            </div>
                        </div>

                        <!-- CTA Button -->
                        <div style="text-align:center;margin-bottom:28px;">
                            <a href="https://mudraaa.tech/dashboard" style="display:inline-block;background:#2EA043;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">Go to Dashboard →</a>
                        </div>

                        <div style="border-top:1px solid #f0f0f0;padding-top:24px;">
                            <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;text-align:center;">
                                We're continuously working on new features to make your experience even better.<br>Have questions? Just reply to this email.
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="text-align:center;margin-top:32px;padding:20px;">
                        <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Mudraaa — Real-time market intelligence</p>
                        <p style="color:#d1d5db;font-size:11px;margin:0;">Explore. Connect. Stay Informed.</p>
                    </div>

                </div>
                </body>
                </html>
            `;

            await resend.emails.send({
                from: process.env.RESEND_FROM || "Mudraaa <onboarding@resend.dev>",
                to: email,
                subject: "Welcome to Mudraaa! 🎉",
                html: welcomeHtml
            });
        } catch (welcomeErr) {
            console.error("WELCOME EMAIL ERROR:", welcomeErr);
        }

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
router.post("/api/profile/avatar", avatarJsonParser, async (req, res) => {
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
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, buffer);

        // Process avatar: resize + convert to WebP for smaller files
        const webpFilename = `avatar-${user._id}-${Date.now()}.webp`;
        const webpPath = path.join(uploadDir, webpFilename);
        try {
            await sharp(filePath)
                .resize({ width: 256, height: 256, fit: "cover" })
                .webp({ quality: 80 })
                .toFile(webpPath);
            // Remove original
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
            user.avatar = webpFilename;
        } catch (sharpErr) {
            console.error("Avatar sharp error:", sharpErr.message);
            // Fallback: use original
            user.avatar = filename;
        }

        await user.save();

        res.json({
            success: true,
            avatar: "/uploads/" + user.avatar
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

        const user = await User.findById(decoded.id).select("username email avatar premium").lean();

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

        const user = await User.findById(decoded.id).select("username email avatar premium").lean();

        if (!user) return res.redirect("/login");

        // Premium check
        if (!user.premium) {
            return res.send("Buy Premium to access the chat room.");
            // or: return res.redirect("/dashboard");
        }

        // Load the last 100 messages from MongoDB (lean + projection for speed)
        const messages = await Message.find({}, { username: 1, message: 1, createdAt: 1 })
            .sort({ createdAt: 1 })
            .limit(100)
            .lean();

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

        const user = await User.findById(decoded.id).select("username email avatar premium").lean();

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

        const user = await User.findById(decoded.id).select("username email avatar premium").lean();

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