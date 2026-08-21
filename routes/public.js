const express = require("express");
const News = require("../models/News");
const User = require("../models/user");

const router = express.Router();

// ── News Page Cache (30 seconds) ────────────────────────────────
const newsCache = { data: null, expires: 0 };
const NEWS_CACHE_TTL = 30000;

// ── Helpers ──────────────────────────────────────────────────────

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

function safeExcerpt(content, maxLen) {
    maxLen = maxLen || 160;
    var text = stripHtml(content);
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

function formatRelativeDate(date) {
    if (!date) return "";
    var now = Date.now();
    var d = new Date(date).getTime();
    var diff = now - d;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return mins + "m ago";
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    var days = Math.floor(hrs / 24);
    if (days < 7) return days + "d ago";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
    });
}

function formatFullDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });
}

// ── Public News Listing Page ─────────────────────────────────────

router.get("/news", async function (req, res) {
    try {
        // Serve from cache if fresh
        if (newsCache.data && Date.now() < newsCache.expires) {
            return res.render("news", newsCache.data);
        }

        var now = Date.now();
        var windowMs = 15 * 24 * 60 * 60 * 1000;
        var windowStart = new Date(now - windowMs);

        var published = await News.find({ status: "published" })
            .sort({ publishedAt: -1 })
            .limit(100)
            .select("title excerpt content featuredImage category tags views featured publishedAt slug showAuthor author")
            .populate("author", "username avatar")
            .lean();

        published.forEach(function (p) {
            p._excerpt = p.excerpt || safeExcerpt(p.content, 160);
            p._relativeDate = formatRelativeDate(p.publishedAt);
            p._fullDate = formatFullDate(p.publishedAt);
            if (!p.featuredImage) p.featuredImage = "";
            if (!p.showAuthor) {
                p.author = null;
            } else if (p.author) {
                p._authorName = p.author.username || "";
                p._authorAvatar = p.author.avatar || "";
                p.author = null;
            }
        });

        var eligible = published.filter(function (p) {
            return p.publishedAt && new Date(p.publishedAt).getTime() >= windowStart.getTime();
        });

        var maxViews = eligible.reduce(function (max, p) {
            return Math.max(max, p.views || 0);
        }, 0);

        eligible.forEach(function (p) {
            var ageHours = Math.max((now - new Date(p.publishedAt).getTime()) / (1000 * 60 * 60), 0);
            var freshness = 1 / (1 + ageHours / 24);
            var views = p.views || 0;
            var viewScore = maxViews > 0 ? views / maxViews : 0;
            p._score = Math.round((freshness * 0.7 + viewScore * 0.3) * 100) / 100;
        });

        var trending = eligible.slice().sort(function (a, b) { return b._score - a._score; }).slice(0, 8);

        var featured = published.filter(function (p) { return p.featured; }).slice(0, 4);

        var latest = published.slice().sort(function (a, b) {
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        }).slice(0, 12);

        var renderData = {
            trending: trending,
            featured: featured,
            latest: latest
        };

        // Cache the rendered data
        newsCache.data = renderData;
        newsCache.expires = Date.now() + NEWS_CACHE_TTL;

        res.render("news", renderData);
    } catch (err) {
        console.error("Public news page error:", err);
        res.status(500).send("Error loading news");
    }
});

// ── Public Article Page ──────────────────────────────────────────

router.get("/news/:id", async function (req, res) {
    try {
        var post = await News.findOne({ _id: req.params.id, status: "published" })
            .populate("author", "username avatar")
            .lean();
        if (!post) return res.status(404).send("Article not found");

        post._excerpt = post.excerpt || safeExcerpt(post.content, 200);
        post._fullDate = formatFullDate(post.publishedAt);
        post._relativeDate = formatRelativeDate(post.publishedAt);

        if (!post.showAuthor) {
            post.author = null;
        } else if (post.author) {
            post._authorName = post.author.username || "";
            post._authorAvatar = post.author.avatar || "";
            post.author = null;
        }

        var recent = await News.find({ status: "published", _id: { $ne: post._id } })
            .sort({ publishedAt: -1 })
            .limit(5)
            .select("title excerpt featuredImage publishedAt category")
            .lean();

        recent.forEach(function (r) {
            r._excerpt = r.excerpt || safeExcerpt(r.content, 100);
            r._relativeDate = formatRelativeDate(r.publishedAt);
            if (!r.featuredImage) r.featuredImage = "";
        });

        res.render("article", {
            post: post,
            recent: recent
        });
    } catch (err) {
        console.error("Article page error:", err);
        res.status(500).send("Error loading article");
    }
});

// ── Cache invalidation helper (called after news create/update/delete) ──
router._invalidateNewsCache = function () {
    newsCache.data = null;
    newsCache.expires = 0;
};

// ── View Increment (public, rate-limited per IP per article) ────

var viewCounts = {};
var VIEW_WINDOW = 60 * 60 * 1000;

setInterval(function () {
    var now = Date.now();
    for (var key in viewCounts) {
        if (viewCounts[key] < now - VIEW_WINDOW) {
            delete viewCounts[key];
        }
    }
}, 300000);

router.post("/api/news/:id/view", async function (req, res) {
    try {
        var ip = req.ip || req.connection.remoteAddress || "unknown";
        var key = req.params.id + ":" + ip;
        var now = Date.now();

        if (viewCounts[key] && (now - viewCounts[key]) < VIEW_WINDOW) {
            return res.json({ success: true, views: 0 });
        }

        var post = await News.findOneAndUpdate(
            { _id: req.params.id, status: "published" },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!post) return res.status(404).json({ error: "Not found" });

        viewCounts[key] = now;
        res.json({ success: true, views: post.views });
    } catch (err) {
        console.error("View increment error:", err);
        res.status(500).json({ error: "Failed" });
    }
});

module.exports = router;
