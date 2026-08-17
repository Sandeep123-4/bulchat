/* Mudraaa Crypto */

function applyTheme() {
    var s = localStorage.getItem("theme");
    if (s === "light") {
        document.body.classList.add("light-theme");
        document.getElementById("themeToggle").textContent = "Dark Mode";
    } else {
        document.body.classList.remove("light-theme");
        document.getElementById("themeToggle").textContent = "Light Mode";
    }
}
document.getElementById("themeToggle").addEventListener("click", function () {
    document.body.classList.toggle("light-theme");
    var isLight = document.body.classList.contains("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    document.getElementById("themeToggle").textContent = isLight ? "Dark Mode" : "Light Mode";
});
applyTheme();

var nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
var nfInt = new Intl.NumberFormat("en-US");

function fmtPrice(v) {
    if (v == null) return "--";
    if (v >= 1) return "$" + nf.format(v);
    if (v >= 0.01) return "$" + nf.format(v);
    return "$" + v.toFixed(6);
}
function fmtBig(v) {
    if (v == null) return "--";
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
    if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
    if (v >= 1e3) return "$" + (v / 1e3).toFixed(2) + "K";
    return "$" + nf.format(v);
}
function fmtTrades(v) { if (v == null) return "--"; return nfInt.format(v); }
function chgCls(v) { return v > 0 ? "up" : v < 0 ? "down" : "flat"; }
function chgHtml(v) {
    if (v == null) return '<span class="muted">--</span>';
    var sign = v > 0 ? "+" : "";
    return '<span class="change-cell ' + chgCls(v) + '">' + sign + v.toFixed(2) + '%</span>';
}

var COIN_COLORS = {
    BTC: "#f7931a", ETH: "#627eea", BNB: "#f3ba2f", SOL: "#9945ff",
    XRP: "#00aae4", ADA: "#0033ad", DOGE: "#c2a633", TRX: "#ff0013",
    AVAX: "#e84142", DOT: "#e6007a", LINK: "#2a5ada", SHIB: "#ffa409",
    LTC: "#bfbbbb", BCH: "#8dc351", UNI: "#ff007a", XLM: "#14b6e7",
    ATOM: "#2e3148", FIL: "#0090ff", HBAR: "#000000", APT: "#4cd7b0",
    ARB: "#28a0f0", OP: "#ff0420", NEAR: "#00c08b", MKR: "#1aab9b",
    INJ: "#00f2fe", RENDER: "#00f2fe", SEI: "#9b1c2e", TON: "#0098ea",
    PEPE: "#4caf50", WLD: "#00f2fe", AAVE: "#b6509e", ALGO: "#000000",
    CRV: "#00f2fe", SUI: "#4da2ff", AR: "#00f2fe", JUP: "#00f2fe",
    STX: "#5546ff", PYTH: "#00f2fe", TIA: "#7b2bf9", ONDO: "#1c45ff",
    ENA: "#00f2fe", KAITO: "#00f2fe", BONK: "#f7931a", WIF: "#f7931a",
    FLOKI: "#f7931a", NEO: "#00f2fe", ZEC: "#ecb244", DASH: "#008de4",
    EOS: "#00f2fe", ICP: "#29abe2", COMP: "#00d395", SNX: "#00f2fe",
    YFI: "#00f2fe", SUSHI: "#fa52a0", LRC: "#00f2fe", ZIL: "#49c9c9",
    FLOW: "#00ef8b", CHZ: "#cd002a", ENJ: "#624db9", GALA: "#ffffff",
    APE: "#00f2fe", IMX: "#00f2fe", FET: "#00f2fe", IOTA: "#00f2fe",
    VET: "#15bdff", THETA: "#00f2fe", XTZ: "#2c7df7"
};

function coinColor(sym) {
    if (COIN_COLORS[sym]) return COIN_COLORS[sym];
    var hash = 0;
    for (var j = 0; j < sym.length; j++) { hash = sym.charCodeAt(j) + ((hash << 5) - hash); }
    return "hsl(" + (hash % 360) + ",55%,45%)";
}

var allCoins = [];

function renderTable(coins) {
    var body = document.getElementById("cryptoBody");
    body.innerHTML = "";
    coins.forEach(function (c, i) {
        var color = coinColor(c.symbol);
        var imgHtml = c.image
            ? '<img class="coin-img" src="' + c.image + '" alt="' + c.symbol + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="coin-icon" style="display:none;background:' + color + '">' + c.symbol.substring(0, 2) + '</div>'
            : '<div class="coin-icon" style="background:' + color + '">' + c.symbol.substring(0, 2) + '</div>';
        var tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        (function (coin) {
            tr.addEventListener("click", function () { openChart(coin); });
        })(c);
        tr.innerHTML =
            '<td class="rank">' + (i + 1) + '</td>' +
            '<td><div class="coin-info">' + imgHtml + '<div><span class="coin-symbol">' + c.symbol + '</span><br><span class="coin-name">' + c.name + '</span></div></div></td>' +
            '<td class="price-cell">' + fmtPrice(c.price) + '</td>' +
            '<td>' + chgHtml(c.priceChangePercent24h) + '</td>' +
            '<td class="muted">' + fmtPrice(c.high24h) + '</td>' +
            '<td class="muted">' + fmtPrice(c.low24h) + '</td>' +
            '<td>' + fmtBig(c.totalVolume) + '</td>' +
            '<td class="muted">' + fmtTrades(c.trades) + '</td>';
        body.appendChild(tr);
    });
}

document.getElementById("searchInput").addEventListener("input", function () {
    var q = this.value.toLowerCase().trim();
    if (!q) { renderTable(allCoins); return; }
    var filtered = allCoins.filter(function (c) {
        return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
    });
    renderTable(filtered);
});

document.querySelectorAll("thead th").forEach(function (th) {
    th.addEventListener("click", function () {
        var col = this.dataset.col;
        if (!col) return;
        document.querySelectorAll("thead th").forEach(function (t) { t.classList.remove("active"); });
        this.classList.add("active");
        var isAsc = this.dataset.dir === "asc";
        document.querySelectorAll("thead th").forEach(function (t) { t.dataset.dir = ""; });
        this.dataset.dir = isAsc ? "desc" : "asc";
        var dir = isAsc ? -1 : 1;
        allCoins.sort(function (a, b) {
            var va, vb;
            switch (col) {
                case "rank": return dir * (allCoins.indexOf(a) - allCoins.indexOf(b));
                case "symbol": return dir * a.symbol.localeCompare(b.symbol);
                case "price": va = a.price; vb = b.price; break;
                case "change24h": va = a.priceChangePercent24h || 0; vb = b.priceChangePercent24h || 0; break;
                case "high24h": va = a.high24h || 0; vb = b.high24h || 0; break;
                case "low24h": va = a.low24h || 0; vb = b.low24h || 0; break;
                case "volume": va = a.totalVolume; vb = b.totalVolume; break;
                case "trades": va = a.trades; vb = b.trades; break;
                default: return 0;
            }
            return (va - vb) * dir;
        });
        renderTable(allCoins);
    });
});

async function loadCrypto() {
    try {
        var res = await fetch("/api/crypto");
        if (!res.ok) throw new Error("HTTP " + res.status);
        var data = await res.json();
        if (data.error) {
            document.getElementById("loadingState").style.display = "none";
            document.getElementById("errorState").textContent = data.error;
            document.getElementById("errorState").style.display = "block";
            return;
        }
        allCoins = data;
        var totalVol = 0;
        var topGainer = { symbol: "--", priceChangePercent24h: -Infinity };
        var topLoser = { symbol: "--", priceChangePercent24h: Infinity };
        data.forEach(function (c) {
            totalVol += c.totalVolume || 0;
            if (c.priceChangePercent24h > topGainer.priceChangePercent24h) topGainer = c;
            if (c.priceChangePercent24h < topLoser.priceChangePercent24h) topLoser = c;
        });
        document.getElementById("totalVol").textContent = fmtBig(totalVol);
        document.getElementById("topGainer").textContent = topGainer.symbol + " (+" + topGainer.priceChangePercent24h.toFixed(2) + "%)";
        document.getElementById("topLoser").textContent = topLoser.symbol + " (" + topLoser.priceChangePercent24h.toFixed(2) + "%)";
        renderTable(allCoins);
        document.getElementById("loadingState").style.display = "none";
        document.getElementById("summaryRow").style.display = "flex";
        document.getElementById("tableWrap").style.display = "block";
    } catch (err) {
        console.error("Crypto load error:", err);
        document.getElementById("loadingState").style.display = "none";
        document.getElementById("errorState").textContent = "Failed to load crypto data. Please try again later.";
        document.getElementById("errorState").style.display = "block";
    }
}
loadCrypto();

/* Candle Chart */
var candleChart = null;
var candleSeries = null;
var volumeSeries = null;
var currentCoin = null;
var currentTF = "1d";

var BINANCE_INTERVALS = {
    "1h": { interval: "15m", limit: 60 },
    "4h": { interval: "1h", limit: 60 },
    "1d": { interval: "1d", limit: 90 },
    "1w": { interval: "1w", limit: 52 }
};

function openChart(coin) {
    currentCoin = coin;
    currentTF = "1d";
    document.getElementById("chartCoinName").textContent = coin.symbol + " / USDT - " + coin.name;
    document.getElementById("chartCoinPrice").textContent = fmtPrice(coin.price) + "  " + (coin.priceChangePercent24h > 0 ? "+" : "") + coin.priceChangePercent24h.toFixed(2) + "%";
    document.getElementById("chartOverlay").classList.add("active");
    document.querySelectorAll(".tf-btn").forEach(function (b) { b.classList.remove("active"); });
    document.querySelector('.tf-btn[data-tf="1d"]').classList.add("active");
    document.getElementById("chartBody").innerHTML = '<div class="chart-loading" id="chartLoading"><div class="spinner"></div>Loading chart...</div>';
    loadCandleData(coin.symbol + "USDT", "1d", 90);
}

function loadCandleData(symbol, tf, limit) {
    var cfg = BINANCE_INTERVALS[tf] || { interval: "1d", limit: 90 };
    document.getElementById("chartBody").innerHTML = '<div class="chart-loading" id="chartLoading"><div class="spinner"></div>Loading chart...</div>';
    fetch("/api/crypto/candle?symbol=" + encodeURIComponent(symbol) + "&interval=" + cfg.interval + "&limit=" + cfg.limit)
        .then(function (r) { return r.json(); })
        .then(function (data) {
            document.getElementById("chartBody").innerHTML = "";
            if (!data || data.length === 0) {
                document.getElementById("chartBody").innerHTML = '<div class="chart-loading">No data available</div>';
                return;
            }
            candleChart = LightweightCharts.createChart(document.getElementById("chartBody"), {
                width: document.getElementById("chartBody").clientWidth,
                height: 400,
                layout: { background: { type: "solid", color: "transparent" }, textColor: "#8b949e", fontSize: 12 },
                grid: { vertLines: { color: "rgba(45,51,59,0.5)" }, horzLines: { color: "rgba(45,51,59,0.5)" } },
                crosshair: { mode: 0 },
                rightPriceScale: { borderColor: "#2D333B" },
                timeScale: { borderColor: "#2D333B", timeVisible: tf === "1h" || tf === "4h" }
            });
            candleSeries = candleChart.addCandlestickSeries({
                upColor: "#16a34a", downColor: "#dc2626", borderDownColor: "#dc2626", borderUpColor: "#16a34a", wickDownColor: "#dc2626", wickUpColor: "#16a34a"
            });
            candleSeries.setData(data.map(function (c) { return { time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }; }));
            volumeSeries = candleChart.addHistogramSeries({ priceFormat: { type: "volume" }, priceScaleId: "vol" });
            candleChart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
            volumeSeries.setData(data.map(function (c) {
                return { time: c.time, value: c.volume, color: c.close >= c.open ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)" };
            }));
            candleChart.timeScale().fitContent();
            window.addEventListener("resize", function () {
                if (candleChart) candleChart.applyOptions({ width: document.getElementById("chartBody").clientWidth });
            });
        })
        .catch(function (err) {
            console.error("Candle load error:", err);
            document.getElementById("chartBody").innerHTML = '<div class="chart-loading">Failed to load chart</div>';
        });
}

document.getElementById("chartClose").addEventListener("click", function () {
    document.getElementById("chartOverlay").classList.remove("active");
    if (candleChart) { candleChart.remove(); candleChart = null; }
});
document.getElementById("chartOverlay").addEventListener("click", function (e) {
    if (e.target === this) {
        this.classList.remove("active");
        if (candleChart) { candleChart.remove(); candleChart = null; }
    }
});
document.querySelectorAll(".tf-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
        document.querySelectorAll(".tf-btn").forEach(function (b) { b.classList.remove("active"); });
        this.classList.add("active");
        currentTF = this.dataset.tf;
        if (currentCoin) {
            var cfg = BINANCE_INTERVALS[currentTF] || BINANCE_INTERVALS["1d"];
            loadCandleData(currentCoin.symbol + "USDT", currentTF, cfg.limit);
        }
    });
});
