/* Mudraaa Dashboard */

var translations = {
    en: {
        welcome: "Welcome,",
        topSub: "Here's your market overview",
        marketOverview: "Market Overview",
        statChange: "Change",
        statHigh: "Day High",
        statLow: "Day Low",
        yourProfile: "Your Profile",
        changePhoto: "Change photo",
        edit: "edit",
        premium: "Premium:  ",
        premiumActive: " active",
        premiumInactive: "not active",
        activate: "activate",
        premiumText: "enjoy free suggestions from chat",
        quickTitle: "Quick Actions",
        chatRoom: "Chat Room",
        commodities: "Commodities",
        crypto: "Crypto",
        chartTitle: "NEPSE Index Trend",
        subIndices: "Sub-indices",
        marketMovers: "Market Movers",
        gainers: "Gainers",
        losers: "Losers",
        turnover: "turnover",
        volume: "volume",
        symbol: "Symbol",
        pctChg: "% Chg",
        point: "point",
        turnoverHdr: "Turnover",
        volumeHdr: "Volume",
        open: "Open",
        close: "Close",
        previous: "previous",
        allSubIndices: "All Sub-indices Details",
        index: "Index",
        value: "Value",
        pointChange: "Point Change",
        pctChange: "% Change"
    },
    ne: {
        welcome: "स्वागत छ,",
        topSub: "यहाँ तपाईंको बजार अवलोकन",
        marketOverview: "बजार अवलोकन",
        statChange: "परिवर्तन",
        statHigh: "दिनको उच्च",
        statLow: "दिनको निम्न",
        yourProfile: "तपाईंको प्रोफाइल",
        changePhoto: "फोटो परिवर्तन गर्नुहोस्",
        edit: "सम्पादन",
        premium: "प्रिमियम:  ",
        premiumActive: " सक्रिय",
        premiumInactive: "सक्रिय छैन",
        activate: "सक्रिय गर्नुहोस्",
        premiumText: "च्याटबाट निःशुल्क सुझावहरूको आनन्द लिनुहोस्",
        quickTitle: "द्रुत कार्यहरू",
        chatRoom: "च्याट रुम",
        commodities: "वस्तुहरू",
        crypto: "क्रिप्टो",
        chartTitle: "नेप्से सूचकाङ्क प्रवृत्ति",
        subIndices: "सब-सूचकाङ्कहरू",
        marketMovers: "बजार चलायमानहरू",
        gainers: "लाभकर्ताहरू",
        losers: "हार्नेहरू",
        turnover: "कारोबार",
        volume: "भोल्युम",
        symbol: "प्रतीक",
        pctChg: "% परिवर्तन",
        point: "अंक",
        turnoverHdr: "कारोबार",
        volumeHdr: "भोल्युम",
        open: "उद्घाटन",
        close: "बन्द",
        previous: "अघिल्लो",
        allSubIndices: "सबै सब-सूचकाङ्क विवरणहरू",
        index: "सूचकाङ्क",
        value: "मूल्य",
        pointChange: "अंक परिवर्तन",
        pctChange: "% परिवर्तन"
    }
};

var body = document.body;
var themeBtn = document.getElementById("themeBtn");
var langBtn = document.getElementById("langBtn");
var currentLang = "en";

function applyTheme(theme) {
    if (theme === "dark") {
        body.classList.remove("light-theme");
        body.classList.add("dark-theme");
    } else {
        body.classList.remove("dark-theme");
        body.classList.add("light-theme");
    }
    themeBtn.textContent = currentLang === "ne"
        ? (body.classList.contains("dark-theme") ? "लाइट मोड" : "डार्क मोड")
        : (body.classList.contains("dark-theme") ? "Light Mode" : "Dark Mode");
    if (window.redrawCharts) { window.redrawCharts(); }
}

function applyLang(lang) {
    currentLang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.dataset.i18n;
        var value = translations[lang][key];
        if (value !== undefined) { el.innerHTML = value; }
    });
    langBtn.textContent = lang === "ne" ? "English" : "नेपाली";
    applyTheme(body.classList.contains("dark-theme") ? "dark" : "light");
}

var savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") { applyTheme("dark"); } else { applyTheme("light"); }
if (localStorage.getItem("lang") === "ne") { applyLang("ne"); } else { applyLang("en"); }

themeBtn.addEventListener("click", function () {
    var isDark = body.classList.contains("dark-theme");
    var next = isDark ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
});

langBtn.addEventListener("click", function () {
    var next = currentLang === "ne" ? "en" : "ne";
    localStorage.setItem("lang", next);
    applyLang(next);
});

/* Profile picture upload */
var avatarOverlay = document.getElementById("avatarOverlay");
var avatarInput = document.getElementById("avatarInput");

avatarOverlay.addEventListener("click", function () { avatarInput.click(); });

avatarInput.addEventListener("change", async function () {
    var file = this.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB."); return; }

    var reader = new FileReader();
    reader.onload = async function () {
        var res;
        try {
            res = await fetch("/api/profile/avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ image: reader.result })
            });
        } catch (err) {
            console.error("Avatar upload error:", err);
            alert("Network error - check if the server is running");
            return;
        }
        var data;
        try {
            data = await res.json();
        } catch (err) {
            var text = await res.text().catch(function () { return ""; });
            console.error("Non-JSON response:", res.status, text);
            alert("Upload failed (server replied with " + res.status + "). Restart the server with the new code.");
            return;
        }
        if (!res.ok) { alert(data.message || "Upload failed"); return; }
        document.getElementById("profileAvatar").src = data.avatar + "?t=" + Date.now();
    };
    reader.readAsDataURL(file);
    this.value = "";
});

/* Username edit */
document.getElementById("edityourname").addEventListener("click", function () {
    var nameDiv = document.getElementById("nameDisplay");
    nameDiv.innerHTML = '<input type="text" id="usernameInput" placeholder="Enter name"><button id="saveyourname">Save</button>';
    document.getElementById("usernameInput").focus();
    document.getElementById("saveyourname").addEventListener("click", saveUsername);
});

async function saveUsername() {
    var input = document.getElementById("usernameInput");
    var newName = input.value.trim();
    if (!newName) { alert("Enter a name"); return; }
    try {
        var response = await fetch("/profile/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username: newName })
        });
        var data = await response.json();
        console.log("Server response:", data);
        if (!response.ok) { alert(data.message || "Failed to save"); return; }
        document.getElementById("nameDisplay").innerHTML =
            '<span id="usernameText">' + data.username + '</span><button id="edityourname">Edit</button>';
        document.getElementById("edityourname").addEventListener("click", editUsername);
    } catch (error) {
        console.error("Save error:", error);
        alert("Server error");
    }
}

function editUsername() {
    var nameDiv = document.getElementById("nameDisplay");
    nameDiv.innerHTML = '<input type="text" id="usernameInput" placeholder="Enter name"><button id="saveyourname">Save</button>';
    document.getElementById("usernameInput").focus();
    document.getElementById("saveyourname").addEventListener("click", saveUsername);
}

/* NEPSE Index */
async function fetchNepseIndex() {
    try {
        var response = await fetch('/api/nepse-index');
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var nindex = document.getElementById("nepseIndex");
        nindex.innerHTML = '<span class="nepse-label">Nepse: </span>' + Number(data["NEPSE Index"].currentValue).toFixed(2);
        var changepercentage = document.getElementById("changePercent");
        var change = document.getElementById("change");
        if (data["NEPSE Index"].close < data["NEPSE Index"].currentValue) {
            nindex.style.color = "#32CD32";
            changepercentage.textContent = Number(-data["NEPSE Index"].perChange).toFixed(2) + "%";
            changepercentage.style.color = "#32CD32";
            change.textContent = Number(data["NEPSE Index"].change).toFixed(2);
            change.style.color = "#32CD32";
        } else {
            nindex.style.color = "#FF0000";
            changepercentage.textContent = Number(data["NEPSE Index"].perChange).toFixed(2) + "%";
            changepercentage.style.color = "#FF0000";
            change.textContent = Number(data["NEPSE Index"].change).toFixed(2);
            change.style.color = "#FF0000";
        }
        document.getElementById("high").textContent = Number(data["NEPSE Index"].high).toFixed(2);
        document.getElementById("low").textContent = Number(data["NEPSE Index"].low).toFixed(2);
    } catch (error) { console.error("NEPSE API ERROR:", error); }
}

/* Top Gainers */
async function fetchTopGainers() {
    try {
        var response = await fetch('/api/top-gainers');
        var response1 = await fetch('/api/TradeTurnoverTransactionSubindices');
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var data1 = await response1.json();
        var top10 = data.slice(0, 10);
        var allStocks = data1.scripsDetails || {};
        var scripsDetails = {};
        top10.forEach(function (topStock) {
            var symbol = String(topStock.symbol).trim().toUpperCase();
            scripsDetails[symbol] = allStocks[symbol] || topStock;
        });
        var table = document.getElementById("topGainersTable");
        table.innerHTML = "";
        top10.forEach(function (stock) {
            var row = document.createElement("div");
            var detail = scripsDetails[stock.symbol] || {};
            row.className = "ide gainer-row clickable-row";
            row.dataset.symbol = stock.symbol;
            row.innerHTML =
                '<div>' + stock.symbol + '</div>' +
                '<div>' + Number(stock.ltp).toFixed(2) + '</div>' +
                '<div>' + Number(stock.percentageChange).toFixed(2) + '%</div>' +
                '<div>+' + Number(stock.pointChange).toFixed(2) + '</div>' +
                '<div>' + Number(detail.Turnover ?? 0).toLocaleString() + '</div>' +
                '<div>' + Number(detail.volume ?? 0).toLocaleString() + '</div>' +
                '<div>' + Number(stock.ltp - stock.pointChange ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(stock.cp).toFixed(2) + '</div>' +
                '<div>' + Number(detail.previousClose ?? 0).toFixed(2) + '</div>';
            table.appendChild(row);
        });
    } catch (error) { console.error("NEPSE API ERROR:", error); }
}

/* Top Losers */
async function fetchTopLosers() {
    try {
        var response = await fetch('/api/top-losers');
        var response1 = await fetch('/api/TradeTurnoverTransactionSubindices');
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var data1 = await response1.json();
        var top10 = data.slice(0, 10);
        var table = document.getElementById("topLosersTable");
        var allStocks = data1.scripsDetails || {};
        var scripsDetails = {};
        top10.forEach(function (topStock) {
            var symbol = String(topStock.symbol).trim().toUpperCase();
            scripsDetails[symbol] = allStocks[symbol] || topStock;
        });
        document.getElementById("topGainersTable").innerHTML = "";
        table.innerHTML = "";
        top10.forEach(function (stock) {
            var row = document.createElement("div");
            row.className = "ide loser-row clickable-row";
            row.dataset.symbol = stock.symbol;
            var detail = scripsDetails[stock.symbol] || {};
            row.innerHTML =
                '<div>' + (stock.symbol || "-") + '</div>' +
                '<div>' + Number(stock.ltp ?? stock.close ?? stock.lastTradedPrice ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(stock.percentageChange ?? stock.changePercent ?? stock.percentChange ?? 0).toFixed(2) + '%</div>' +
                '<div>' + Number(stock.pointChange).toFixed(2) + '</div>' +
                '<div>' + Number(detail.Turnover ?? detail.turnover ?? 0).toLocaleString() + '</div>' +
                '<div>' + Number(detail.volume ?? 0).toLocaleString() + '</div>' +
                '<div>' + Number(stock.ltp - stock.pointChange ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(stock.cp ?? stock.close ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(detail.previousClose ?? 0).toFixed(2) + '</div>';
            table.appendChild(row);
        });
    } catch (error) { console.error("NEPSE API ERROR:", error); }
}

/* Top Turnover */
async function fetchTopTurnover() {
    try {
        var response = await fetch('/api/TopTenTurnoverScrips');
        var response1 = await fetch('/api/TradeTurnoverTransactionSubindices');
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var data1 = await response1.json();
        if (!Array.isArray(data)) { data = data.data || data.scripsDetails || []; }
        var top10 = data.slice(0, 10);
        var allStocks = data1.scripsDetails || {};
        var scripsDetails = {};
        top10.forEach(function (topStock) {
            var symbol = String(topStock.symbol).trim().toUpperCase();
            scripsDetails[symbol] = allStocks[symbol] || topStock;
        });
        var table = document.getElementById("topGainersTable");
        table.innerHTML = "";
        top10.forEach(function (stock) {
            var symbol = String(stock.symbol).trim().toUpperCase();
            var detail = scripsDetails[symbol] || {};
            var row = document.createElement("div");
            row.className = "ide clickable-row";
            row.dataset.symbol = symbol;
            row.innerHTML =
                '<div>' + (stock.symbol ?? "-") + '</div>' +
                '<div>' + Number(detail.ltp ?? stock.closingPrice ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(detail.percentageChange ?? stock.percentageChange ?? 0).toFixed(2) + '%</div>' +
                '<div>' + Number(detail.pointChange ?? stock.pointChange ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(detail.turnover ?? detail.Turnover ?? stock.turnover ?? 0).toLocaleString() + '</div>' +
                '<div>' + Number(detail.volume ?? 0).toLocaleString() + '</div>' +
                '<div>' + Number(detail.open ?? detail.ltp - (detail.pointChange ?? 0) ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(detail.cp ?? detail.close ?? stock.closingPrice ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(detail.previousClose ?? 0).toFixed(2) + '</div>';
            table.appendChild(row);
        });
    } catch (error) { console.error("TURNOVER API ERROR:", error); }
}

/* Top Volume */
async function fetchTopVolume() {
    try {
        var response = await fetch('/api/TopTenTransactionScrips');
        var response1 = await fetch('/api/TradeTurnoverTransactionSubindices');
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var data1 = await response1.json();
        if (!Array.isArray(data)) { data = data.data || data.scripsDetails || []; }
        var top10 = data.slice(0, 10);
        var allStocks = data1.scripsDetails || {};
        var scripsDetails = {};
        top10.forEach(function (topStock) {
            var symbol = String(topStock.symbol).trim().toUpperCase();
            scripsDetails[symbol] = allStocks[symbol] || topStock;
        });
        var table = document.getElementById("topGainersTable");
        table.innerHTML = "";
        top10.forEach(function (stock) {
            var symbol = String(stock.symbol).trim().toUpperCase();
            var detail = scripsDetails[symbol] || {};
            var row = document.createElement("div");
            row.className = "ide clickable-row";
            row.dataset.symbol = symbol;
            row.innerHTML =
                '<div>' + (stock.symbol ?? "-") + '</div>' +
                '<div>' + Number(detail.ltp ?? stock.lastTradedPrice ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(detail.percentageChange ?? stock.percentageChange ?? 0).toFixed(2) + '%</div>' +
                '<div>' + Number(detail.pointChange ?? stock.pointChange ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(detail.turnover ?? detail.Turnover ?? stock.turnover ?? 0).toLocaleString() + '</div>' +
                '<div>' + Number(detail.volume ?? 0).toLocaleString() + '</div>' +
                '<div>' + Number(detail.open ?? detail.ltp - (detail.pointChange ?? 0) ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(detail.cp ?? detail.close ?? stock.lastTradedPrice ?? 0).toFixed(2) + '</div>' +
                '<div>' + Number(detail.previousClose ?? 0).toFixed(2) + '</div>';
            table.appendChild(row);
        });
    } catch (error) { console.error("VOLUME API ERROR:", error); }
}

/* Search / Company List */
async function fetchCompanyList() {
    var search = document.querySelector(".search");
    var searchResults = document.getElementById("searchResults");
    var activeIndex = -1;
    var currentItems = [];

    function highlight(text, query) {
        var safeText = String(text ?? "");
        var lower = safeText.toLowerCase();
        var q = query.toLowerCase();
        if (!q || !lower.includes(q)) return safeText;
        var start = lower.indexOf(q);
        var end = start + q.length;
        return safeText.slice(0, start) + '<span class="hl">' + safeText.slice(start, end) + '</span>' + safeText.slice(end);
    }

    function goToStock(symbol) {
        window.location.href = "/stock/" + encodeURIComponent(symbol);
    }

    function renderResults(results, query) {
        currentItems = results;
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-empty">No stocks found for "<strong>' + escapeHtml(query) + '"</strong></div>';
            return;
        }
        searchResults.innerHTML =
            '<div class="search-results-head">Stocks (' + results.length + ')</div>' +
            results.map(function (stock, i) {
                return '<div class="search-item ' + (i === activeIndex ? "active" : "") + '" data-symbol="' + stock.symbol + '">' +
                    '<span class="s-item-symbol">' + highlight(stock.symbol, query) + '</span>' +
                    '<span class="s-item-name">' + highlight(stock.securityName || stock.companyName || "", query) + '</span>' +
                    '<span class="s-item-sector">' + (stock.sectorName || stock.instrumentType || "") + '</span>' +
                    '</div>';
            }).join("");
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    search.addEventListener("input", async function (event) {
        var query = event.target.value.trim().replace(/\s+/g, " ");
        activeIndex = -1;
        if (!query) { searchResults.innerHTML = ""; searchResults.style.display = "none"; return; }
        searchResults.style.display = "block";
        try {
            var response = await fetch("/api/CompanyList");
            if (!response.ok) throw new Error("HTTP " + response.status);
            var companies = await response.json();
            var results = companies.filter(function (stock) {
                var name = String(stock.symbol || stock.securityName || "").toLowerCase();
                return query.toLowerCase().split(" ").every(function (word) { return name.includes(word); });
            }).slice(0, 12);
            renderResults(results, query);
        } catch (error) { console.error("Search error:", error); }
    });

    search.addEventListener("keydown", function (event) {
        if (searchResults.style.display === "none") return;
        var items = searchResults.querySelectorAll(".search-item");
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (items.length === 0) return;
            activeIndex = event.key === "ArrowDown" ? (activeIndex + 1) % items.length : (activeIndex - 1 + items.length) % items.length;
            items.forEach(function (item, i) { item.classList.toggle("active", i === activeIndex); });
            items[activeIndex].scrollIntoView({ block: "nearest" });
        }
        if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
            event.preventDefault();
            goToStock(items[activeIndex].dataset.symbol);
        }
        if (event.key === "Escape") { searchResults.style.display = "none"; }
    });

    searchResults.addEventListener("click", function (event) {
        var item = event.target.closest(".search-item");
        if (item) goToStock(item.dataset.symbol);
    });

    document.addEventListener("click", function (event) {
        if (!search.contains(event.target) && !searchResults.contains(event.target)) {
            search.value = "";
            searchResults.style.display = "none";
            activeIndex = -1;
        }
    });
}

/* Sub Indices (scrolling) */
async function fetchSubIndices() {
    try {
        var response = await fetch("/api/NepseSubIndices");
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var subindices = Object.values(data);
        var containers = document.querySelectorAll(".showindexsub");
        containers.forEach(function (container) {
            container.innerHTML = "";
            var track = document.createElement("div");
            track.className = "subindex-track";
            var items = subindices.concat(subindices);
            items.forEach(function (index) {
                var item = document.createElement("div");
                item.className = "subindex-item";
                var name = index.index ?? index.name ?? index.indexName ?? "-";
                var value = index.value ?? index.close ?? index.currentValue ?? 0;
                var change = index.percentageChange ?? index.changePercent ?? index.perChange ?? 0;
                var pointChange = index.pointChange ?? index.change ?? 0;
                item.innerHTML =
                    '<span class="subindex-name">' + name + '</span>' +
                    '<span class="subindex-value">' + Number(value).toFixed(2) + '</span>' +
                    '<span class="subindex-change ' + (Number(change) >= 0 ? "positive" : "negative") + '">' +
                    Number(pointChange).toFixed(2) + ' (' + Number(change).toFixed(2) + '%)</span>';
                track.appendChild(item);
            });
            container.appendChild(track);
        });
    } catch (error) { console.error("Subindices error:", error); }
}
fetchSubIndices();

/* Sub Indices Details (table) */
async function fetchSubIndicesDetails() {
    try {
        var response = await fetch("/api/NepseSubIndices");
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var subindices = Object.values(data);
        subindices.sort(function (a, b) { return String(a.index ?? "").localeCompare(String(b.index ?? "")); });
        var table = document.getElementById("subindicesTable");
        table.innerHTML = "";
        subindices.forEach(function (index) {
            var change = Number(index.change ?? 0);
            var perChange = Number(index.perChange ?? 0);
            var isUp = change >= 0;
            var color = isUp ? "#16a34a" : "#dc2626";
            var row = document.createElement("div");
            row.className = "ide sub-ide";
            row.innerHTML =
                '<div>' + (index.index ?? "-") + '</div>' +
                '<div>' + Number(index.currentValue ?? 0).toFixed(2) + '</div>' +
                '<div style="color:' + color + '">' + change.toFixed(2) + '</div>' +
                '<div style="color:' + color + '">' + perChange.toFixed(2) + '%</div>';
            table.appendChild(row);
        });
    } catch (error) { console.error("Subindices details error:", error); }
}
fetchSubIndicesDetails();

/* Index Chart */
async function fetchIndexChart() {
    try {
        var response = await fetch("/api/DailyNepseIndexGraph");
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return;
        var points = [];
        data.forEach(function (item) {
            var pair = item;
            if (Array.isArray(pair) && pair.length >= 2) {
                points.push({ t: Number(pair[0]), v: Number(pair[1]) });
            }
        });
        if (points.length === 0) return;
        var labels = points.map(function (p) {
            return new Date(p.t * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        });
        var values = points.map(function (p) { return p.v; });
        drawLineChart("indexChart", labels, values);
    } catch (error) { console.error("Index chart error:", error); }
}
fetchIndexChart();

/* Clicking any stock row opens its detail page */
document.addEventListener("click", function (event) {
    var row = event.target.closest(".ide.clickable-row");
    if (row && row.dataset.symbol) {
        window.location.href = "/stock/" + encodeURIComponent(row.dataset.symbol);
    }
});

/* Tab switching */
var Gainer = document.getElementById("Gainer");
var Loser = document.getElementById("Loser");
var turnover = document.getElementById("turnover");
var volume = document.getElementById("volume");
var gainersTable = document.getElementById("topGainersTable");
var losersTable = document.getElementById("topLosersTable");

function setActiveTab(btn) {
    [Gainer, Loser, turnover, volume].forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
}

Gainer.addEventListener("click", function () { setActiveTab(Gainer); losersTable.innerHTML = ""; fetchTopGainers(); });
Loser.addEventListener("click", function () { setActiveTab(Loser); gainersTable.innerHTML = ""; fetchTopLosers(); });
turnover.addEventListener("click", function () { setActiveTab(turnover); losersTable.innerHTML = ""; gainersTable.innerHTML = ""; fetchTopTurnover(); });
volume.addEventListener("click", function () { setActiveTab(volume); losersTable.innerHTML = ""; gainersTable.innerHTML = ""; fetchTopVolume(); });

/* Global Prices (Gold) */
async function fetchGlobalPrices() {
    try {
        var response = await fetch("/api/global-prices");
        if (!response.ok) return;
        var data = await response.json();
        var nfNpr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "NPR", maximumFractionDigits: 0 });
        var goldEl = document.getElementById("goldPrice");
        if (goldEl) {
            goldEl.textContent = nfNpr.format(data.gold.npr);
            var goldCh = document.getElementById("goldChange");
            goldCh.textContent = (data.gold.change >= 0 ? "+" : "") + data.gold.change.toFixed(2) + "%";
            goldCh.className = "ticker-change " + (data.gold.change >= 0 ? "up" : "down");
        }
    } catch (e) { console.log("Global prices error:", e.message); }
}

/* Init */
fetchNepseIndex();
fetchGlobalPrices();
fetchCompanyList();
fetchTopGainers();
setActiveTab(Gainer);
setInterval(fetchNepseIndex, 10000);
setInterval(fetchGlobalPrices, 60000);
