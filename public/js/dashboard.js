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
        turnover: "Turnover",
        volume: "Volume",
        symbol: "Symbol",
        pctChg: "% Chg",
        point: "Point",
        turnoverHdr: "Turnover",
        volumeHdr: "Volume",
        open: "Open",
        close: "Close",
        previous: "Prev",
        allSubIndices: "All Sub-indices Details",
        index: "Index",
        value: "Value",
        pointChange: "Point Chg",
        pctChange: "% Change",
        sidebarDashboard: "Dashboard"
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
        pctChange: "% परिवर्तन",
        sidebarDashboard: "ड्यासबोर्ड"
    }
};

/* ===== Theme & Lang ===== */
var body = document.body;
var themeBtn = document.getElementById("themeBtn");
var langBtn = document.getElementById("langBtn");
var currentLang = "en";

var ICON_MOON = '<svg class="ctrl-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
var ICON_SUN = '<svg class="ctrl-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

function applyTheme(theme) {
    if (theme === "dark") {
        body.classList.remove("light-theme");
        body.classList.add("dark-theme");
    } else {
        body.classList.remove("dark-theme");
        body.classList.add("light-theme");
    }
    var isDark = body.classList.contains("dark-theme");
    themeBtn.innerHTML = isDark ? ICON_MOON : ICON_SUN;
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

/* ===== Mobile Sidebar ===== */
var mobileMenuBtn = document.getElementById("mobileMenuBtn");
var sidebar = document.querySelector(".sidebar");
var sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar() {
    sidebar.classList.add("open");
    if (sidebarOverlay) sidebarOverlay.classList.add("visible");
}
function closeSidebar() {
    sidebar.classList.remove("open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("visible");
}

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", function () {
        if (sidebar.classList.contains("open")) { closeSidebar(); } else { openSidebar(); }
    });
    document.addEventListener("click", function (e) {
        if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            closeSidebar();
        }
    });
}
if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", function () { closeSidebar(); });
}

/* ===== Utilities ===== */
function debounce(fn, ms) {
    var timer;
    return function () {
        var args = arguments;
        var ctx = this;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
}

function removeLoadingEl(id) {
    var el = document.getElementById(id);
    if (el) {
        var row = el.closest("tr") || el.closest(".loading-wrap");
        if (row && row.tagName === "TR") { row.remove(); }
        else if (el.classList.contains("loading-wrap")) { el.remove(); }
    }
}

/* ===== Profile (kept for JS compat) ===== */
var avatarOverlay = document.getElementById("avatarOverlay");
var avatarInput = document.getElementById("avatarInput");
if (avatarOverlay && avatarInput) {
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
                console.error("Non-JSON response:", res.status);
                alert("Upload failed");
                return;
            }
            if (!res.ok) { alert(data.message || "Upload failed"); return; }
            var avatar = document.getElementById("profileAvatar");
            if (avatar) avatar.src = data.avatar + "?t=" + Date.now();
        };
        reader.readAsDataURL(file);
        this.value = "";
    });
}

var edityourname = document.getElementById("edityourname");
if (edityourname) {
    edityourname.addEventListener("click", function () {
        var nameDiv = document.getElementById("nameDisplay");
        nameDiv.innerHTML = '<input type="text" id="usernameInput" placeholder="Enter name"><button id="saveyourname">Save</button>';
        document.getElementById("usernameInput").focus();
        document.getElementById("saveyourname").addEventListener("click", saveUsername);
    });
}

async function saveUsername() {
    var input = document.getElementById("usernameInput");
    if (!input) return;
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

/* ===== NEPSE Index ===== */
async function fetchNepseIndex() {
    try {
        var response = await fetch('/api/nepse-index');
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var nindex = document.getElementById("nepseIndex");
        var idx = data["NEPSE Index"];
        nindex.innerHTML = '<span class="nepse-label">Nepse </span>' + Number(idx.currentValue).toFixed(2);
        var changepercentage = document.getElementById("changePercent");
        var change = document.getElementById("change");
        var isUp = idx.close < idx.currentValue;
        nindex.style.color = isUp ? "#16a34a" : "#dc2626";
        changepercentage.textContent = (isUp ? "+" : "") + Number(idx.perChange).toFixed(2) + "%";
        changepercentage.style.color = isUp ? "#16a34a" : "#dc2626";
        changepercentage.style.background = isUp ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)";
        change.textContent = (isUp ? "+" : "") + Number(idx.change).toFixed(2);
        change.style.color = isUp ? "#16a34a" : "#dc2626";
        document.getElementById("high").textContent = Number(idx.high).toFixed(2);
        document.getElementById("low").textContent = Number(idx.low).toFixed(2);
    } catch (error) { console.error("NEPSE API ERROR:", error); }
}

/* ===== Market Movers (Table-based) ===== */
function buildTableRow(stock, detail, rowClass) {
    var tr = document.createElement("tr");
    tr.className = rowClass;
    tr.dataset.symbol = stock.symbol || "";
    var pctChange = Number(stock.percentageChange ?? stock.changePercent ?? stock.percentChange ?? 0);
    var pctClass = pctChange >= 0 ? "td-up" : "td-down";
    var pctPrefix = pctChange >= 0 ? "+" : "";
    var pointChange = Number(stock.pointChange ?? 0);
    var pointPrefix = pointChange >= 0 ? "+" : "";
    var turnover = Number(detail.Turnover ?? detail.turnover ?? 0);
    var volume = Number(detail.volume ?? 0);
    var open = Number(stock.ltp - (stock.pointChange ?? 0) ?? 0);
    var cp = Number(stock.cp ?? stock.close ?? stock.closingPrice ?? 0);
    var prev = Number(detail.previousClose ?? 0);
    tr.innerHTML =
        '<td class="td-symbol">' + (stock.symbol || "-") + '</td>' +
        '<td>' + Number(stock.ltp ?? stock.close ?? stock.lastTradedPrice ?? 0).toFixed(2) + '</td>' +
        '<td class="' + pctClass + '">' + pctPrefix + pctChange.toFixed(2) + '%</td>' +
        '<td class="' + pctClass + '">' + pointPrefix + pointChange.toFixed(2) + '</td>' +
        '<td>' + turnover.toLocaleString() + '</td>' +
        '<td>' + volume.toLocaleString() + '</td>' +
        '<td>' + open.toFixed(2) + '</td>' +
        '<td>' + cp.toFixed(2) + '</td>' +
        '<td>' + prev.toFixed(2) + '</td>';
    return tr;
}

function buildDetailMap(top10, allStocks) {
    var map = {};
    top10.forEach(function (s) {
        var sym = String(s.symbol).trim().toUpperCase();
        map[sym] = allStocks[sym] || s;
    });
    return map;
}

function fillTableRows(tbodyId, rows) {
    var tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";
    rows.forEach(function (r) { tbody.appendChild(r); });
}

async function fetchTopGainers() {
    try {
        removeLoadingEl("moversLoading");
        var [response, response1] = await Promise.all([
            fetch('/api/top-gainers'),
            fetch('/api/TradeTurnoverTransactionSubindices')
        ]);
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var data1 = await response1.json();
        var top10 = data.slice(0, 10);
        var allStocks = data1.scripsDetails || {};
        var details = buildDetailMap(top10, allStocks);
        var rows = top10.map(function (stock) {
            return buildTableRow(stock, details[stock.symbol] || {}, "row-gainer");
        });
        fillTableRows("topGainersTable", rows);
    } catch (error) { console.error("NEPSE API ERROR:", error); }
}

async function fetchTopLosers() {
    try {
        removeLoadingEl("moversLoading");
        var [response, response1] = await Promise.all([
            fetch('/api/top-losers'),
            fetch('/api/TradeTurnoverTransactionSubindices')
        ]);
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var data1 = await response1.json();
        var top10 = data.slice(0, 10);
        var allStocks = data1.scripsDetails || {};
        var details = buildDetailMap(top10, allStocks);
        var rows = top10.map(function (stock) {
            return buildTableRow(stock, details[stock.symbol] || {}, "row-loser");
        });
        document.getElementById("topGainersTable").innerHTML = "";
        fillTableRows("topLosersTable", rows);
    } catch (error) { console.error("NEPSE API ERROR:", error); }
}

async function fetchTopTurnover() {
    try {
        removeLoadingEl("moversLoading");
        var [response, response1] = await Promise.all([
            fetch('/api/TopTenTurnoverScrips'),
            fetch('/api/TradeTurnoverTransactionSubindices')
        ]);
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var data1 = await response1.json();
        if (!Array.isArray(data)) { data = data.data || data.scripsDetails || []; }
        var top10 = data.slice(0, 10);
        var allStocks = data1.scripsDetails || {};
        var details = buildDetailMap(top10, allStocks);
        var rows = top10.map(function (stock) {
            var sym = String(stock.symbol).trim().toUpperCase();
            var d = details[sym] || {};
            var tr = document.createElement("tr");
            tr.dataset.symbol = sym;
            var pctChange = Number(d.percentageChange ?? stock.percentageChange ?? 0);
            var pctClass = pctChange >= 0 ? "td-up" : "td-down";
            var pctPrefix = pctChange >= 0 ? "+" : "";
            var pointChange = Number(d.pointChange ?? stock.pointChange ?? 0);
            var pointPrefix = pointChange >= 0 ? "+" : "";
            tr.innerHTML =
                '<td class="td-symbol">' + (stock.symbol ?? "-") + '</td>' +
                '<td>' + Number(d.ltp ?? stock.closingPrice ?? 0).toFixed(2) + '</td>' +
                '<td class="' + pctClass + '">' + pctPrefix + pctChange.toFixed(2) + '%</td>' +
                '<td class="' + pctClass + '">' + pointPrefix + pointChange.toFixed(2) + '</td>' +
                '<td>' + Number(d.turnover ?? d.Turnover ?? stock.turnover ?? 0).toLocaleString() + '</td>' +
                '<td>' + Number(d.volume ?? 0).toLocaleString() + '</td>' +
                '<td>' + Number(d.open ?? d.ltp - (d.pointChange ?? 0) ?? 0).toFixed(2) + '</td>' +
                '<td>' + Number(d.cp ?? d.close ?? stock.closingPrice ?? 0).toFixed(2) + '</td>' +
                '<td>' + Number(d.previousClose ?? 0).toFixed(2) + '</td>';
            return tr;
        });
        document.getElementById("topLosersTable").innerHTML = "";
        fillTableRows("topGainersTable", rows);
    } catch (error) { console.error("TURNOVER API ERROR:", error); }
}

async function fetchTopVolume() {
    try {
        removeLoadingEl("moversLoading");
        var [response, response1] = await Promise.all([
            fetch('/api/TopTenTransactionScrips'),
            fetch('/api/TradeTurnoverTransactionSubindices')
        ]);
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var data1 = await response1.json();
        if (!Array.isArray(data)) { data = data.data || data.scripsDetails || []; }
        var top10 = data.slice(0, 10);
        var allStocks = data1.scripsDetails || {};
        var details = buildDetailMap(top10, allStocks);
        var rows = top10.map(function (stock) {
            var sym = String(stock.symbol).trim().toUpperCase();
            var d = details[sym] || {};
            var tr = document.createElement("tr");
            tr.dataset.symbol = sym;
            var pctChange = Number(d.percentageChange ?? stock.percentageChange ?? 0);
            var pctClass = pctChange >= 0 ? "td-up" : "td-down";
            var pctPrefix = pctChange >= 0 ? "+" : "";
            var pointChange = Number(d.pointChange ?? stock.pointChange ?? 0);
            var pointPrefix = pointChange >= 0 ? "+" : "";
            tr.innerHTML =
                '<td class="td-symbol">' + (stock.symbol ?? "-") + '</td>' +
                '<td>' + Number(d.ltp ?? stock.lastTradedPrice ?? 0).toFixed(2) + '</td>' +
                '<td class="' + pctClass + '">' + pctPrefix + pctChange.toFixed(2) + '%</td>' +
                '<td class="' + pctClass + '">' + pointPrefix + pointChange.toFixed(2) + '</td>' +
                '<td>' + Number(d.turnover ?? d.Turnover ?? stock.turnover ?? 0).toLocaleString() + '</td>' +
                '<td>' + Number(d.volume ?? 0).toLocaleString() + '</td>' +
                '<td>' + Number(d.open ?? d.ltp - (d.pointChange ?? 0) ?? 0).toFixed(2) + '</td>' +
                '<td>' + Number(d.cp ?? d.close ?? stock.lastTradedPrice ?? 0).toFixed(2) + '</td>' +
                '<td>' + Number(d.previousClose ?? 0).toFixed(2) + '</td>';
            return tr;
        });
        document.getElementById("topLosersTable").innerHTML = "";
        fillTableRows("topGainersTable", rows);
    } catch (error) { console.error("VOLUME API ERROR:", error); }
}

/* ===== Search (debounced + cached) ===== */
var companyListCache = null;

function initSearch() {
    var search = document.querySelector(".search");
    var searchResults = document.getElementById("searchResults");
    var activeIndex = -1;

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

    function filterCompanies(companies, query) {
        return companies.filter(function (stock) {
            var name = String(stock.symbol || stock.securityName || "").toLowerCase();
            return query.toLowerCase().split(" ").every(function (word) { return name.includes(word); });
        }).slice(0, 12);
    }

    var debouncedSearch = debounce(async function (query) {
        activeIndex = -1;
        searchResults.style.display = "block";
        try {
            if (!companyListCache) {
                var response = await fetch("/api/CompanyList");
                if (!response.ok) throw new Error("HTTP " + response.status);
                companyListCache = await response.json();
            }
            var results = filterCompanies(companyListCache, query);
            renderResults(results, query);
        } catch (error) { console.error("Search error:", error); }
    }, 250);

    search.addEventListener("input", function (event) {
        var query = event.target.value.trim().replace(/\s+/g, " ");
        activeIndex = -1;
        if (!query) { searchResults.innerHTML = ""; searchResults.style.display = "none"; return; }
        debouncedSearch(query);
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

/* ===== Sub Indices (scrolling marquee) ===== */
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

/* ===== Sub Indices Details (table) ===== */
async function fetchSubIndicesDetails() {
    try {
        removeLoadingEl("subindicesLoading");
        var response = await fetch("/api/NepseSubIndices");
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var subindices = Object.values(data);
        subindices.sort(function (a, b) { return String(a.index ?? "").localeCompare(String(b.index ?? "")); });
        var tbody = document.getElementById("subindicesTable");
        tbody.innerHTML = "";
        subindices.forEach(function (index) {
            var change = Number(index.change ?? 0);
            var perChange = Number(index.perChange ?? 0);
            var isUp = change >= 0;
            var colorClass = isUp ? "td-up" : "td-down";
            var prefix = isUp ? "+" : "";
            var tr = document.createElement("tr");
            tr.innerHTML =
                '<td>' + (index.index ?? "-") + '</td>' +
                '<td>' + Number(index.currentValue ?? 0).toFixed(2) + '</td>' +
                '<td class="' + colorClass + '">' + prefix + change.toFixed(2) + '</td>' +
                '<td class="' + colorClass + '">' + prefix + perChange.toFixed(2) + '%</td>';
            tbody.appendChild(tr);
        });
    } catch (error) { console.error("Subindices details error:", error); }
}

/* ===== Index Chart ===== */
async function fetchIndexChart() {
    try {
        var response = await fetch("/api/DailyNepseIndexGraph");
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return;
        var points = [];
        data.forEach(function (item) {
            if (Array.isArray(item) && item.length >= 2) {
                points.push({ t: Number(item[0]), v: Number(item[1]) });
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

/* ===== Clicking stock row opens detail page ===== */
document.addEventListener("click", function (event) {
    var row = event.target.closest("tr[data-symbol]");
    if (row && row.dataset.symbol) {
        window.location.href = "/stock/" + encodeURIComponent(row.dataset.symbol);
    }
});

/* ===== Tab switching ===== */
var Gainer = document.getElementById("Gainer");
var Loser = document.getElementById("Loser");
var turnover = document.getElementById("turnover");
var volume = document.getElementById("volume");

function setActiveTab(btn) {
    [Gainer, Loser, turnover, volume].forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
}

Gainer.addEventListener("click", function () { setActiveTab(Gainer); fetchTopGainers(); });
Loser.addEventListener("click", function () { setActiveTab(Loser); fetchTopLosers(); });
turnover.addEventListener("click", function () { setActiveTab(turnover); fetchTopTurnover(); });
volume.addEventListener("click", function () { setActiveTab(volume); fetchTopVolume(); });

/* ===== Global Prices (Gold) ===== */
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

/* ===== Init (parallel) ===== */
initSearch();
setActiveTab(Gainer);

Promise.allSettled([
    fetchNepseIndex(),
    fetchGlobalPrices(),
    fetchTopGainers(),
    fetchSubIndices(),
    fetchSubIndicesDetails(),
    fetchIndexChart()
]);

/* ===== Visibility API: pause intervals when tab is hidden ===== */
var nepseInterval = setInterval(fetchNepseIndex, 10000);
var pricesInterval = setInterval(fetchGlobalPrices, 60000);

document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
        clearInterval(nepseInterval);
        clearInterval(pricesInterval);
    } else {
        // Refresh immediately when tab becomes visible again
        fetchNepseIndex();
        fetchGlobalPrices();
        nepseInterval = setInterval(fetchNepseIndex, 10000);
        pricesInterval = setInterval(fetchGlobalPrices, 60000);
    }
});
