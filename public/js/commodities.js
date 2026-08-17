/* Mudraaa Commodities */

function applyTheme() {
    var saved = localStorage.getItem("theme");
    if (saved === "light") {
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

function formatPrice(val, currency) {
    if (!val && val !== 0) return "--";
    var sym = currency === "USD" ? "$" : "";
    return sym + nf.format(val);
}
function formatVolume(val) {
    if (!val && val !== 0) return "--";
    if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
    if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
    return nfInt.format(val);
}
function changeClass(val) { return val > 0 ? "up" : val < 0 ? "down" : "flat"; }
function stateClass(state) { return state === "REGULAR" || state === "PRE" || state === "POST" ? "open" : "closed"; }
function stateLabel(state) {
    if (state === "REGULAR") return "Open";
    if (state === "PRE") return "Pre-Market";
    if (state === "POST") return "After-Hours";
    return "Closed";
}

async function loadCommodities() {
    try {
        var res = await fetch("/api/commodities");
        if (!res.ok) throw new Error("HTTP " + res.status);
        var data = await res.json();
        if (data.error) {
            document.getElementById("loadingState").style.display = "none";
            document.getElementById("errorState").textContent = data.error;
            document.getElementById("errorState").style.display = "block";
            return;
        }
        var grid = document.getElementById("commoditiesGrid");
        var gainers = 0, losers = 0, flat = 0;
        data.forEach(function (c) {
            var cls = changeClass(c.change);
            if (cls === "up") gainers++;
            else if (cls === "down") losers++;
            else flat++;
            var arrow = c.change > 0 ? "&#9650;" : c.change < 0 ? "&#9660;" : "";
            var sign = c.change > 0 ? "+" : "";
            var card = document.createElement("div");
            card.className = "commodity-card";
            (function (commodity) {
                card.addEventListener("click", function () { openChart(commodity); });
            })(c);
            card.innerHTML =
                '<div class="commodity-header"><div><div class="commodity-name">' + c.name + '</div><div class="commodity-symbol">' + c.symbol + '</div></div>' +
                '<span class="commodity-state ' + stateClass(c.marketState) + '">' + stateLabel(c.marketState) + '</span></div>' +
                '<div class="commodity-price">' + formatPrice(c.price, c.currency) + '</div>' +
                '<div class="commodity-change ' + cls + '">' + arrow + ' ' + sign + nf.format(c.change) + ' (' + sign + nf.format(c.changePercent) + '%)</div>' +
                '<div class="commodity-stats">' +
                '<div class="commodity-stat"><span class="commodity-stat-label">Open</span><span class="commodity-stat-value">' + formatPrice(c.open, c.currency) + '</span></div>' +
                '<div class="commodity-stat"><span class="commodity-stat-label">Prev Close</span><span class="commodity-stat-value">' + formatPrice(c.previousClose, c.currency) + '</span></div>' +
                '<div class="commodity-stat"><span class="commodity-stat-label">Day High</span><span class="commodity-stat-value">' + formatPrice(c.dayHigh, c.currency) + '</span></div>' +
                '<div class="commodity-stat"><span class="commodity-stat-label">Day Low</span><span class="commodity-stat-value">' + formatPrice(c.dayLow, c.currency) + '</span></div>' +
                '<div class="commodity-stat"><span class="commodity-stat-label">52W High</span><span class="commodity-stat-value">' + formatPrice(c.fiftyTwoWeekHigh, c.currency) + '</span></div>' +
                '<div class="commodity-stat"><span class="commodity-stat-label">52W Low</span><span class="commodity-stat-value">' + formatPrice(c.fiftyTwoWeekLow, c.currency) + '</span></div>' +
                '<div class="commodity-stat"><span class="commodity-stat-label">Volume</span><span class="commodity-stat-value">' + formatVolume(c.volume) + '</span></div>' +
                '<div class="commodity-stat"><span class="commodity-stat-label">Currency</span><span class="commodity-stat-value">' + (c.currency || "--") + '</span></div>' +
                '</div>';
            grid.appendChild(card);
        });
        document.getElementById("loadingState").style.display = "none";
        document.getElementById("summaryRow").style.display = "flex";
        document.getElementById("summaryGainers").textContent = gainers;
        document.getElementById("summaryLosers").textContent = losers;
        document.getElementById("summaryFlat").textContent = flat;
    } catch (err) {
        console.error("Commodities load error:", err);
        document.getElementById("loadingState").style.display = "none";
        document.getElementById("errorState").textContent = "Failed to load commodity data. Please try again later.";
        document.getElementById("errorState").style.display = "block";
    }
}
loadCommodities();

/* Candle Chart */
var candleChart = null;
var candleSeries = null;
var volumeSeries = null;
var currentCommodity = null;
var currentRange = "3mo";

function openChart(commodity) {
    currentCommodity = commodity;
    currentRange = "1d";
    document.getElementById("chartName").textContent = commodity.name + " (" + commodity.symbol + ")";
    var sign = commodity.change > 0 ? "+" : "";
    document.getElementById("chartPrice").textContent = "$" + nf.format(commodity.price) + "  " + sign + nf.format(commodity.change) + " (" + sign + nf.format(commodity.changePercent) + "%)";
    document.getElementById("chartOverlay").classList.add("active");
    document.querySelectorAll(".tf-btn").forEach(function (b) { b.classList.remove("active"); });
    document.querySelector('.tf-btn[data-range="1d"]').classList.add("active");
    document.getElementById("chartBody").innerHTML = '<div class="chart-loading" id="chartLoading"><div class="spinner"></div>Loading chart...</div>';
    loadCandleData(commodity.symbol, "1d");
}

function loadCandleData(symbol, range) {
    document.getElementById("chartBody").innerHTML = '<div class="chart-loading" id="chartLoading"><div class="spinner"></div>Loading chart...</div>';
    fetch("/api/commodity/candle?symbol=" + encodeURIComponent(symbol) + "&range=" + range)
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
                timeScale: { borderColor: "#2D333B", timeVisible: currentRange === "1d" }
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
        currentRange = this.dataset.range;
        if (currentCommodity) {
            loadCandleData(currentCommodity.symbol, currentRange);
        }
    });
});
