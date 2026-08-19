const express = require("express");
const Message = require("./models/Message");
const User = require("./models/user");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const axios = require("axios");
const compression = require("compression");
const fs = require("fs");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();


const PRICE_HISTORY_DIR = path.join(__dirname, "data");
const PRICE_HISTORY_FILE = path.join(PRICE_HISTORY_DIR, "price-history.json");

function loadPriceHistory() {
    try {
        if (!fs.existsSync(PRICE_HISTORY_DIR)) {
            fs.mkdirSync(PRICE_HISTORY_DIR, { recursive: true });
        }
        if (!fs.existsSync(PRICE_HISTORY_FILE)) {
            fs.writeFileSync(PRICE_HISTORY_FILE, "{}", "utf-8");
            return {};
        }
        return JSON.parse(fs.readFileSync(PRICE_HISTORY_FILE, "utf-8"));
    } catch (e) {
        return {};
    }
}

function savePriceHistory(data) {
    if (!fs.existsSync(PRICE_HISTORY_DIR)) {
        fs.mkdirSync(PRICE_HISTORY_DIR, { recursive: true });
    }
    fs.writeFileSync(PRICE_HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function cacheStockOHLCV(symbol, ohlcv) {
    const history = loadPriceHistory();
    if (!history[symbol]) {
        history[symbol] = [];
    }
    const today = ohlcv.date;
    const existing = history[symbol].findIndex(d => d.date === today);
    if (existing >= 0) {
        history[symbol][existing] = ohlcv;
    } else {
        history[symbol].push(ohlcv);
    }
    history[symbol].sort((a, b) => a.date.localeCompare(b.date));
    if (history[symbol].length > 500) {
        history[symbol] = history[symbol].slice(-500);
    }
    savePriceHistory(history);
}



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

        const data = response.data;

        const dto = data.securityDailyTradeDto || {};
        const businessDate = dto.businessDate;
        if (businessDate && dto.lastTradedPrice) {
            const ohlcv = {
                date: businessDate.split("T")[0],
                open: Number(dto.openPrice || dto.lastTradedPrice),
                high: Number(dto.highPrice || dto.lastTradedPrice),
                low: Number(dto.lowPrice || dto.lastTradedPrice),
                close: Number(dto.lastTradedPrice),
                volume: Number(dto.totalTradeQuantity || 0)
            };
            try {
                cacheStockOHLCV(symbol, ohlcv);
            } catch (cacheErr) {
                console.log("Price cache error:", cacheErr.message);
            }
        }

        res.json(data);

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

app.get("/api/StockHistory/:symbol", async (req, res) => {

    try {
        const symbol = req.params.symbol;

        const [histRes, intraRes] = await Promise.all([
            axios.get(
                "http://localhost:8000/PriceVolumeHistory",
                { params: { symbol: symbol, size: 250 }, timeout: 15000 }
            ).catch(() => ({ data: [] })),
            axios.get(
                "http://localhost:8000/DailyScripPriceGraph",
                { params: { symbol: symbol, type: 1 }, timeout: 15000 }
            ).catch(() => ({ data: [] }))
        ]);

        const rawHist = Array.isArray(histRes.data) ? histRes.data : [];
        const rawIntra = Array.isArray(intraRes.data) ? intraRes.data : [];

        const dailyCandles = [];
        for (let i = 0; i < rawHist.length; i++) {
            const r = rawHist[i];
            const close = Number(r.closePrice || 0);
            const open = i < rawHist.length - 1
                ? Number(rawHist[i + 1].closePrice || close)
                : close;
            dailyCandles.push({
                time: r.businessDate,
                open: open,
                high: Number(r.highPrice || close),
                low: Number(r.lowPrice || close),
                close: close,
                volume: Number(r.totalTradedQuantity || 0)
            });
        }
        dailyCandles.sort((a, b) => a.time.localeCompare(b.time));

        const intraCandles = [];
        if (rawIntra.length > 0) {
            const bucketSize = 5 * 60;
            const buckets = {};

            for (const tick of rawIntra) {
                const rate = Number(tick.contractRate || 0);
                const ts = Number(tick.time || 0);
                if (!rate || !ts) continue;
                const bucket = Math.floor(ts / bucketSize) * bucketSize;

                if (!buckets[bucket]) {
                    buckets[bucket] = { open: rate, high: rate, low: rate, close: rate, time: bucket };
                } else {
                    const b = buckets[bucket];
                    b.high = Math.max(b.high, rate);
                    b.low = Math.min(b.low, rate);
                    b.close = rate;
                }
            }

            Object.values(buckets)
                .sort((a, b) => a.time - b.time)
                .forEach(b => {
                    intraCandles.push({
                        time: b.time,
                        open: b.open,
                        high: b.high,
                        low: b.low,
                        close: b.close
                    });
                });
        }

        res.json({ daily: dailyCandles, intraday: intraCandles });

    } catch(error) {
        console.log(error.response?.data || error.message);
        res.status(500).json({ error: "Unable to fetch stock history" });
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

// Commodities API
const COMMODITY_SYMBOLS = [
    { symbol: "GC=F", name: "Gold" },
    { symbol: "SI=F", name: "Silver" },
    { symbol: "CL=F", name: "Crude Oil" },
    { symbol: "NG=F", name: "Natural Gas" },
    { symbol: "HG=F", name: "Copper" },
    { symbol: "PL=F", name: "Platinum" },
    { symbol: "PA=F", name: "Palladium" },
    { symbol: "ZW=F", name: "Wheat" },
    { symbol: "ZC=F", name: "Corn" },
    { symbol: "ZS=F", name: "Soybeans" },
    { symbol: "SB=F", name: "Sugar" },
    { symbol: "KC=F", name: "Coffee" },
    { symbol: "CT=F", name: "Cotton" }
];

app.get("/api/commodities", async (req, res) => {
    try {
        const results = [];

        for (const item of COMMODITY_SYMBOLS) {
            try {
                const quote = await yahooFinance.quote(item.symbol);
                results.push({
                    symbol: item.symbol,
                    name: item.name,
                    price: quote.regularMarketPrice || 0,
                    change: quote.regularMarketChange || 0,
                    changePercent: quote.regularMarketChangePercent || 0,
                    previousClose: quote.regularMarketPreviousClose || 0,
                    open: quote.regularMarketOpen || 0,
                    dayHigh: quote.regularMarketDayHigh || 0,
                    dayLow: quote.regularMarketDayLow || 0,
                    volume: quote.regularMarketVolume || 0,
                    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
                    fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
                    marketState: quote.marketState || "CLOSED",
                    currency: quote.currency || "USD"
                });
            } catch (e) {
                console.error(`Quote error for ${item.symbol}:`, e.message);
                results.push({
                    symbol: item.symbol,
                    name: item.name,
                    price: 0,
                    change: 0,
                    changePercent: 0,
                    error: true
                });
            }
        }

        res.json(results);
    } catch (error) {
        console.error("Commodities API error:", error);
        res.status(500).json({ error: "Unable to fetch commodity data" });
    }
});

// Crypto API - Binance (free, no key)
app.get("/api/crypto", async (req, res) => {
    try {
        const response = await axios.get(
            "https://api.binance.com/api/v3/ticker/24hr",
            { timeout: 10000 }
        );

        const STABLECOINS = new Set([
            "USDCUSDT", "BUSDUSDT", "TUSDUSDT", "DAIUSDT", "FDUSDUSDT",
            "USD1USDT", "UUSDT", "RLUSDUSDT", "EURUSDT", "EURIUSDT",
            "GBPUSDT", "AUDUSDT", "BIDRUSDT", "BVNDUSDT", "IDRTUSDT",
            "PAXGUSDT", "XAUTUSDT"
        ]);

        const COIN_META = {
            BTCUSDT: { name: "Bitcoin", img: "1/small/bitcoin.png" },
            ETHUSDT: { name: "Ethereum", img: "279/small/ethereum.png" },
            BNBUSDT: { name: "BNB", img: "825/small/bnb-icon2_2x.png" },
            XRPUSDT: { name: "XRP", img: "44/small/xrp-symbol-white-128.png" },
            SOLUSDT: { name: "Solana", img: "4128/small/solana.jpg" },
            ADAUSDT: { name: "Cardano", img: "975/small/cardano-logo.png" },
            DOGEUSDT: { name: "Dogecoin", img: "5/small/dogecoin.png" },
            AVAXUSDT: { name: "Avalanche", img: "2507/small/Avalanche_Circle_RedWhite_Trans.png" },
            DOTUSDT: { name: "Polkadot", img: "12221/small/polkadot.png" },
            LINKUSDT: { name: "Chainlink", img: "877/small/chainlink-new-logo.png" },
            SHIBUSDT: { name: "Shiba Inu", img: "11939/small/shiba.png" },
            LTCUSDT: { name: "Litecoin", img: "49/small/litecoin.png" },
            BCHUSDT: { name: "Bitcoin Cash", img: "7804/small/bitcoin-cash-circle-icon.png" },
            UNIUSDT: { name: "Uniswap", img: "12504/small/uni.jpg" },
            XLMUSDT: { name: "Stellar", img: "12424/small/Stellar_symbol_black_RGB.png" },
            ATOMUSDT: { name: "Cosmos", img: "1481/small/cosmos_hub.png" },
            FILUSDT: { name: "Filecoin", img: "12817/small/filecoin.png" },
            HBARUSDT: { name: "Hedera", img: "3688/small/hedera-hbar-logo.png" },
            APTUSDT: { name: "Aptos", img: "26455/small/aptos_round.png" },
            ARBUSDT: { name: "Arbitrum", img: "16547/small/photo_2023-03-29_21.47.00.jpeg" },
            OPUSDT: { name: "Optimism", img: "25245/small/Optimism.png" },
            NEARUSDT: { name: "NEAR Protocol", img: "10365/small/near.jpg" },
            MKRUSDT: { name: "Maker", img: "1364/small/mkr.png" },
            INJUSDT: { name: "Injective", img: "12882/small/injective.png" },
            FETUSDT: { name: "Fetch.ai", img: "29855/small/fet.png" },
            RENDERUSDT: { name: "Render", img: "17748/small/Render.png" },
            SEIUSDT: { name: "Sei", img: "28205/small/sei.jpg" },
            TONUSDT: { name: "Toncoin", img: "17980/small/ton_symbol.png" },
            PEPEUSDT: { name: "Pepe", img: "29850/small/pepe-token.jpeg" },
            WLDUSDT: { name: "Worldcoin", img: "29852/small/wld.png" },
            AAVEUSDT: { name: "Aave", img: "12645/small/AAVE.png" },
            ALGOUSDT: { name: "Algorand", img: "19124/small/algorand_logo_circle_in_white黑色.jpg" },
            CRVUSDT: { name: "Curve", img: "12124/small/Curve.png" },
            SUIUSDT: { name: "Sui", img: "26375/small/sui_asset.jpeg" },
            ARUSDT: { name: "Arweave", img: "4340/small/arweave.png" },
            JUPUSDT: { name: "Jupiter", img: "33796/small/jup.png" },
            STXUSDT: { name: "Stacks", img: "34097/small/Stacks_Logo_png_original.png" },
            PYTHUSDT: { name: "Pyth Network", img: "30149/small/pyth.png" },
            TIAUSDT: { name: "Celestia", img: "28974/small/terra.png" },
            ONDOUSDT: { name: "Ondo Finance", img: "32181/small/Ondo_Icon_Circle_PNG.png" },
            ENAUSDT: { name: "Ethena", img: "33798/small/ethena.png" },
            KAITOUSDT: { name: "Kaito", img: "37827/small/kaito.jpg" },
            BONKUSDT: { name: "Bonk", img: "28861/small/bonk.jpg" },
            WIFUSDT: { name: "dogwifhat", img: "31194/small/wif.png" },
            FLOKIUSDT: { name: "FLOKI", img: "16746/small/floki_logo_round.png" },
            TRXUSDT: { name: "TRON", img: "10945/small/TRON.jpg" },
            NEOUSDT: { name: "Neo", img: "21/small/neo-logo.png" },
            ZECUSDT: { name: "Zcash", img: "44/small/zcash.png" },
            EOSUSDT: { name: "EOS", img: "13838/small/eos-eos-logo.png" },
            ICPUSDT: { name: "Internet Computer", img: "14415/small/Internet_Computer_logo.png" },
            COMPUSDT: { name: "Compound", img: "12671/small/compound.png" },
            SNXUSDT: { name: "Synthetix", img: "3406/small/Synthetix_SNX.png" },
            YFIUSDT: { name: "yearn.finance", img: "11849/small/yfi.jpg" },
            SUSHIUSDT: { name: "SushiSwap", img: "12271/small/sushi.png" },
            LRCUSDT: { name: "Loopring", img: "9135/small/LRC.png" },
            ZILUSDT: { name: "Zilliqa", img: "2691/small/zilliqa-logo.png" },
            CHZUSDT: { name: "Chiliz", img: "1069/small/chiliz.png" },
            ENJUSDT: { name: "Enjin", img: "13875/small/enjin-logo.png" },
            GALAUSDT: { name: "Gala", img: "12445/small/GALA-COINGECKO.jpg" },
            APEUSDT: { name: "ApeCoin", img: "24383/small/apecoin-200x200.png" },
            IMXUSDT: { name: "Immutable", img: "17229/small/GkqBjV1KdH0sE2MtRh4LsnqAIs4.png" },
            VETUSDT: { name: "VeChain", img: "115/small/VET_Token_Icon.png" },
            THETAUSDT: { name: "Theta", img: "25382/small/theta-token-logo.png" },
            XTZUSDT: { name: "Tezos", img: "1070/small/tezos-logo.png" },
            FTMUSDT: { name: "Fantom", img: "35604/small/20210126_054529.jpg" },
            GRTUSDT: { name: "The Graph", img: "13397/small/TheGraphToken.png" },
            SANDUSDT: { name: "The Sandbox", img: "12129/small/sandbox_logo.jpg" },
            MANAUSDT: { name: "Decentraland", img: "11939/small/decentraland-mana-logo.png" },
            AXSUSDT: { name: "Axie Infinity", img: "10365/small/axie.png" },
            JASMYUSDT: { name: "Jasmy", img: "21583/small/jasmy2.png" },
            SAGAUSDT: { name: "Saga", img: "28684/small/saga_64.png" },
            DYMUSDT: { name: "Dymension", img: "30373/small/dym.png" },
            STRKUSDT: { name: "Starknet", img: "26486/small/StarkNet.png" },
            FLOWUSDT: { name: "Flow", img: "13446/small/flow.png" },
            EOSUSDT: { name: "EOS", img: "13838/small/eos-eos-logo.png" }
        };

        const SKIP_PREFIXES = ["UP", "DOWN", "BULL", "BEAR", "3L", "3S", "5L", "5S"];

        const data = response.data
            .filter(t => {
                if (!t.symbol.endsWith("USDT")) return false;
                if (STABLECOINS.has(t.symbol)) return false;
                const base = t.symbol.slice(0, -4);
                if (SKIP_PREFIXES.some(p => base.startsWith(p))) return false;
                if (/[^A-Z0-9]/.test(base)) return false;
                if (base.length < 2 || base.length > 8) return false;
                return true;
            })
            .map(t => {
                const sym = t.symbol.replace("USDT", "");
                const meta = COIN_META[t.symbol];
                return {
                    symbol: sym,
                    name: meta ? meta.name : sym,
                    image: meta ? "https://assets.coingecko.com/coins/images/" + meta.img : null,
                    price: parseFloat(t.lastPrice),
                    priceChangePercent24h: parseFloat(t.priceChangePercent),
                    priceChange24h: parseFloat(t.priceChange),
                    high24h: parseFloat(t.highPrice),
                    low24h: parseFloat(t.lowPrice),
                    openPrice: parseFloat(t.openPrice),
                    totalVolume: parseFloat(t.quoteVolume),
                    trades: parseInt(t.count)
                };
            })
            .sort((a, b) => b.totalVolume - a.totalVolume)
            .slice(0, 50);

        res.json(data);
    } catch (error) {
        console.error("Crypto API error:", error.message);
        res.status(500).json({ error: "Unable to fetch crypto data" });
    }
});

// Crypto Candle API (Binance klines)
app.get("/api/crypto/candle", async (req, res) => {
    try {
        const symbol = req.query.symbol || "BTCUSDT";
        const interval = req.query.interval || "1d";
        const limit = parseInt(req.query.limit) || 90;

        const response = await axios.get(
            "https://api.binance.com/api/v3/klines",
            {
                params: { symbol, interval, limit },
                timeout: 10000
            }
        );

        const candles = response.data.map(k => ({
            time: Math.floor(k[0] / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));

        res.json(candles);
    } catch (error) {
        console.error("Crypto candle error:", error.message);
        res.status(500).json({ error: "Unable to fetch candle data" });
    }
});

// Commodity Candle API (Yahoo Finance)
app.get("/api/commodity/candle", async (req, res) => {
    try {
        const symbol = req.query.symbol || "GC=F";
        const range = req.query.range || "3mo";

        const now = new Date();
        let period1 = new Date();

        switch (range) {
            case "1d":   period1.setDate(now.getDate() - 1); break;
            case "1mo":  period1.setMonth(now.getMonth() - 1); break;
            case "3mo":  period1.setMonth(now.getMonth() - 3); break;
            case "6mo":  period1.setMonth(now.getMonth() - 6); break;
            case "1y":   period1.setFullYear(now.getFullYear() - 1); break;
            case "2y":   period1.setFullYear(now.getFullYear() - 2); break;
            case "3y":   period1.setFullYear(now.getFullYear() - 3); break;
            case "5y":   period1.setFullYear(now.getFullYear() - 5); break;
            default:     period1.setMonth(now.getMonth() - 3);
        }

        const interval = range === "1d" ? "15m" : "1d";

        const response = await yahooFinance.chart(symbol, {
            period1: period1.toISOString().split("T")[0],
            period2: now.toISOString().split("T")[0],
            interval: interval
        });

        if (!response.quotes || response.quotes.length === 0) {
            return res.json([]);
        }

        const candles = response.quotes
            .filter(q => q.open != null && q.close != null)
            .map(q => ({
                time: Math.floor(new Date(q.date).getTime() / 1000),
                open: q.open,
                high: q.high,
                low: q.low,
                close: q.close,
                volume: q.volume || 0
            }));

        res.json(candles);
    } catch (error) {
        console.error("Commodity candle error:", error.message);
        res.status(500).json({ error: "Unable to fetch candle data" });
    }
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.log("❌ MongoDB Error:", err);
});

// Routes
app.set("io", io);
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

        const token = req.cookies.token;
        if (!token) return res.redirect("/login");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        res.render("stock", {
            symbol: symbol,
            user: user
        });

    } catch (error) {
        return res.status(404).send("Page not found");
    }
});

app.get("/api/global-prices", async (req, res) => {
    try {
        const [btcRes, goldRes, fxRes] = await Promise.all([
            axios.get("https://api.binance.com/api/v3/ticker/24hr", {
                params: { symbol: "BTCUSDT" },
                timeout: 10000
            }),
            axios.get("https://api.fenegosida.org/api/website/v1/Dashboard/today", {
                timeout: 10000
            }),
            axios.get("https://api.binance.com/api/v3/ticker/24hr", {
                params: { symbol: "ETHUSDT" },
                timeout: 10000
            })
        ]);

        const btcUsd = Number(btcRes.data.lastPrice);
        const ethUsd = Number(fxRes.data.lastPrice);

        const goldData = goldRes.data;
        const hallmark = Array.isArray(goldData)
            ? goldData.find(function(r) { return r.rateType && r.rateType.includes("छापावाल") && r.rateType.includes("१ तोला"); })
            : null;
        const goldNpr = hallmark ? Number(hallmark.todayBaseRatePerGram) : 0;
        const goldYesterday = hallmark ? Number(hallmark.yestardayBaseRatePerGram) : 0;
        const goldChange = goldYesterday ? ((goldNpr - goldYesterday) / goldYesterday * 100) : 0;

        const usdNpr = 133.5;

        const btcNpr = btcUsd * usdNpr;
        const ethNpr = ethUsd * usdNpr;

        const btcChange = Number(btcRes.data.priceChangePercent || 0);
        const ethChange = Number(fxRes.data.priceChangePercent || 0);

        res.json({
            usdNpr: usdNpr,
            btc: { usd: btcUsd, npr: btcNpr, change: btcChange },
            eth: { usd: ethUsd, npr: ethNpr, change: ethChange },
            gold: { npr: goldNpr, change: goldChange }
        });
    } catch (error) {
        console.log("Global prices error:", error.message);
        res.status(500).json({ error: "Unable to fetch global prices" });
    }
});

// Broadcast Email
const BROADCAST_PATH = "/S@&deepKh@&al/broaecastEmail";

app.get(BROADCAST_PATH, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.render("broadcast", { userCount });
    } catch (err) {
        console.error("Broadcast page error:", err);
        res.status(500).send("Error loading broadcast page");
    }
});

app.post(BROADCAST_PATH, async (req, res) => {
    try {
        const { subject, body } = req.body;

        if (!subject || !body) {
            return res.status(400).json({ error: "Subject and body are required." });
        }

        const users = await User.find({}, { email: 1 }).lean();

        if (users.length === 0) {
            return res.json({ success: true, message: "No users to send to." });
        }

        let sent = 0;
        let failed = 0;

        for (const user of users) {
            try {
                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
                    <body style="margin:0;padding:0;background:#f4f5f7;font-family:Inter,Helvetica,Arial,sans-serif;">
                    <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
                        <div style="text-align:center;margin-bottom:32px;">
                            <img src="https://mudraaa.tech/img/logo.png" alt="Mudraaa" width="52" height="52" style="border-radius:14px;display:block;margin:0 auto 12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                            <span style="font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.3px;">Mudraaa</span>
                        </div>
                        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                            <div style="border-bottom:1px solid #f0f0f0;padding-bottom:20px;margin-bottom:24px;">
                                <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0;text-align:center;letter-spacing:-0.3px;">${subject}</h2>
                            </div>
                            <div style="color:#374151;font-size:15px;line-height:1.8;word-wrap:break-word;">
                                ${body}
                            </div>
                        </div>
                        <div style="text-align:center;margin-top:32px;padding:20px;">
                            <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;">Mudraaa &mdash; Real-time market intelligence</p>
                            <p style="color:#d1d5db;font-size:11px;margin:0;">You received this because you have a Mudraaa account.</p>
                        </div>
                    </div>
                    </body>
                    </html>
                `;

                await resend.emails.send({
                    from: process.env.RESEND_FROM || "Mudraaa <onboarding@resend.dev>",
                    to: user.email,
                    subject: subject,
                    html: emailHtml
                });

                sent++;
            } catch (emailErr) {
                console.error(`Broadcast email failed for ${user.email}:`, emailErr.message);
                failed++;
            }
        }

        const msg = `Done! Sent to ${sent} user${sent === 1 ? "" : "s"}` + (failed ? `, ${failed} failed.` : ".");

        console.log(`[BROADCAST] ${msg}`);
        res.json({ success: true, message: msg });

    } catch (err) {
        console.error("Broadcast error:", err);
        res.status(500).json({ error: "Failed to send broadcast." });
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