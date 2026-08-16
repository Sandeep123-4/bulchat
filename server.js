const express = require("express");
const Message = require("./models/Message");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const axios = require("axios");
const compression = require("compression");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(
    express.static(path.join(__dirname, "public"), {
        maxAge: "1d",
        setHeaders(res, filePath) {
            // Uploaded files have unique names, safe to cache forever
            if (filePath.includes(path.sep + "uploads" + path.sep)) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            }
        }
    })
);

app.get("/api/nepse-index", async (req, res) => {
    try {
        const response = await axios.get(
            "http://localhost:8000/NepseIndex"
        );

        
    res.json(response.data);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            error: "Unable to fetch NEPSE data"
        });
    }
});

app.get("/api/top-gainers", async (req, res) => {
    try {
        const response = await axios.get(
            "http://localhost:8000/TopGainers",
            { timeout: 10000 }
        );

        res.json(response.data);

    } catch (error) {
        console.error("Top gainers error:", error.message);

        res.status(500).json({
            error: "Unable to fetch top gainers"
        });
    }
});
app.get("/api/top-losers", async (req, res) => {
    try {
        const response = await axios.get(
            "http://localhost:8000/TopLosers",
            { timeout: 10000 }
        );

        res.json(response.data);

    } catch (error) {
        console.error("Top gainers error:", error.message);

        res.status(500).json({
            error: "Unable to fetch top gainers"
        });
    }
});
app.get("/api/CompanyList", async (req, res) => {
    try {
        const response = await axios.get(
            "http://localhost:8000/CompanyList",
            { timeout: 10000 }
        );

        res.json(response.data);

    } catch (error) {
        console.error("Top gainers error:", error.message);

        res.status(500).json({
            error: "Unable to fetch top gainers"
        });
    }
});


app.get("/api/CompanyDetails/:symbol", async (req, res) => {

    try {
        const symbol = req.params.symbol;

        const response = await axios.get(
            "http://localhost:8000/CompanyDetails",
            {
                params: {
                    symbol: symbol
                }
            }
        );

        res.json(response.data);

    } catch(error) {
        console.log(error.response?.data || error.message);

        res.status(500).json({
            error:"Unable to fetch company details"
        });
    }

});
app.get("/api/TopTenTurnoverScrips", async (req, res) => {

    try {

        const response = await axios.get(
            "http://localhost:8000/TopTenTurnoverScrips");

        res.json(response.data);

    } catch(error) {
        console.log(error.response?.data || error.message);

        res.status(500).json({
            error:"Unable to fetch company details"
        });
    }

});

app.get("/api/TradeTurnoverTransactionSubindices", async (req, res) => {

    try {

        const response = await axios.get(
            "http://localhost:8000/TradeTurnoverTransactionSubindices");

        res.json(response.data);

    } catch(error) {
        console.log(error.response?.data || error.message);

        res.status(500).json({
            error:"Unable to fetch company details"
        });
    }

});

app.get("/api/TopTenTurnoverScrips", async (req, res) => {

    try {

        const response = await axios.get(
            "http://localhost:8000/TopTenTurnoverScrips");

        res.json(response.data);

    } catch(error) {
        console.log(error.response?.data || error.message);

        res.status(500).json({
            error:"Unable to fetch company details"
        });
    }

});

app.get("/api/TopTenTransactionScrips", async (req, res) => {

    try {

        const response = await axios.get(
            "http://localhost:8000/TopTenTransactionScrips");

        res.json(response.data);

    } catch(error) {
        console.log(error.response?.data || error.message);

        res.status(500).json({
            error:"Unable to fetch transaction details"
        });
    }

});

app.get("/api/NepseSubIndices", async (req, res) => {

    try {

        const response = await axios.get(
            "http://localhost:8000/NepseSubIndices");

        res.json(response.data);

    } catch(error) {
        console.log(error.response?.data || error.message);

        res.status(500).json({
            error:"Unable to fetch company details"
        });
    }

});

app.get("/api/DailyScripPriceGraph", async (req, res) => {

    try {

        const symbol = req.query.symbol;

        if (!symbol) {
            return res.status(400).json({ error: "symbol is required" });
        }

        const response = await axios.get(
            "http://localhost:8000/DailyScripPriceGraph",
            {
                params: {
                    symbol: symbol,
                    type: 1
                },
                timeout: 15000
            }
        );

        res.json(response.data);

    } catch(error) {
        console.log(error.response?.data || error.message);

        res.status(500).json({
            error:"Unable to fetch price graph"
        });
    }

});

app.get("/api/DailyNepseIndexGraph", async (req, res) => {

    try {

        const response = await axios.get(
            "http://localhost:8000/DailyNepseIndexGraph",
            { timeout: 15000 }
        );

        res.json(response.data);

    } catch(error) {
        console.log(error.response?.data || error.message);

        res.status(500).json({
            error:"Unable to fetch NEPSE index graph"
        });
    }

});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.log("❌ MongoDB Error:", err);
});

// Routes
app.use("/", require("./routes/auth"));

// Socket.IO
const users = {};

io.on("connection", (socket) => {

    console.log("🔵 User Connected:", socket.id);

    socket.on("join", (username) => {

        users[socket.id] = username;

        io.emit("online", Object.values(users));

    });

socket.on("chat message", async (data) => {

    try {

        const message = {
            username: users[socket.id] || "Guest",
            message: data.message,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        };

        // Save message to MongoDB
        await Message.create(message);

        // Send to all connected users
        io.emit("chat message", message);

    } catch (err) {
        console.error("Message Save Error:", err);
    }

});

    socket.on("disconnect", () => {

        console.log("🔴 User Disconnected");

        delete users[socket.id];

        io.emit("online", Object.values(users));

    });

});

app.get("/stock/:symbol", async (req, res) => {
    try {
        const symbol = req.params.symbol;

        res.render("stock", {
            symbol: symbol
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to load stock");
    }
});

// 404
app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});

// Start Server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});