/* Mudraaa Index (Landing Page) */

var translations = {
    en: {
        navLogin: "Log In",
        navSignup: "Sign Up",
        heroTitle: "Live NEPSE Market <span>Intelligence</span>, Built for Traders",
        heroDesc: "Track the NEPSE index in real time, explore top gainers and losers, dive into detailed stock charts, and join our community of investors to share ideas.",
        heroSignup: "Create Free Account",
        heroLogin: "Log In",
        cardNepse: "NEPSE Index",
        statChange: "Change",
        statHigh: "High",
        statLow: "Low",
        cardWhy: "Why Mudraaa?",
        whyText: "Real-time market overview, interactive index charts, sub-indices at a glance, and a premium investor chat room — all in one clean dashboard.",
        cardStart: "Get Started",
        startText: "Create your account in seconds and unlock the full NEPSE experience.",
        startBtn: "Get Started",
        chartTitle: "NEPSE Index Trend",
        featRealTime: "Real-time Data",
        featRealTimeText: "Live NEPSE index, top gainers, losers, turnover and volume updates refreshed automatically.",
        featCharts: "Interactive Charts",
        featChartsText: "Explore index trends and per-stock price graphs with clean, readable visualizations.",
        featCommunity: "Investor Community",
        featCommunityText: "Join the chat room, share market ideas and suggestions with fellow traders.",
        footer: "Mudraaa &copy; 2026. NEPSE data provided for informational purposes only."
    },
    ne: {
        navLogin: "लग इन",
        navSignup: "साइन अप",
        heroTitle: "व्यापारीहरूका लागि निर्मित लाइभ नेप्से बजार <span>बुद्धिमत्ता</span>",
        heroDesc: "नेप्से सूचकाङ्कलाई वास्तविक समयमा ट्र्याक गर्नुहोस्, शीर्ष लाभकर्ता र हार्नेहरू अन्वेषण गर्नुहोस्, विस्तृत स्टक चार्टहरूमा जानुहोस्, र विचार साझा गर्न हाम्रो लगानीकर्ता समुदायमा सामेल हुनुहोस्।",
        heroSignup: "निःशुल्क खाता खोल्नुहोस्",
        heroLogin: "लग इन",
        cardNepse: "नेप्से सूचकाङ्क",
        statChange: "परिवर्तन",
        statHigh: "उच्च",
        statLow: "निम्न",
        cardWhy: "किन Mudraaa?",
        whyText: "वास्तविक-समय बजार अवलोकन, अन्तरक्रियात्मक सूचकाङ्क चार्टहरू, सब-सूचकाङ्कहरू एकै नजरमा, र प्रिमियम लगानीकर्ता च्याट रुम — सबै एकै सफा ड्यासबोर्डमा।",
        cardStart: "सुरु गर्नुहोस्",
        startText: "केही सेकेन्डमा आफ्नो खाता खोल्नुहोस् र पूर्ण नेप्से अनुभव अनलक गर्नुहोस्।",
        startBtn: "सुरु गर्नुहोस्",
        chartTitle: "नेप्से सूचकाङ्क प्रवृत्ति",
        featRealTime: "वास्तविक-समय डाटा",
        featRealTimeText: "नेप्से सूचकाङ्क, शीर्ष लाभकर्ता, हार्नेहरू, कारोबार र भोल्युम अद्यावधिक स्वतः ताजा हुन्छन्।",
        featCharts: "अन्तरक्रियात्मक चार्टहरू",
        featChartsText: "सूचकाङ्क प्रवृत्ति र प्रति-स्टक मूल्य ग्राफहरू सफा, पढ्न मिल्ने भिजुअलाइजेसनसहित अन्वेषण गर्नुहोस्।",
        featCommunity: "लगानीकर्ता समुदाय",
        featCommunityText: "च्याट रुममा सामेल हुनुहोस्, सँगी व्यापारीहरूसँग बजार विचार र सुझावहरू साझा गर्नुहोस्।",
        footer: "Mudraaa &copy; 2026. जानकारीमूलक उद्देश्यका लागि मात्र नेप्से डाटा प्रदान गरिएको छ।"
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
        themeBtn.textContent = currentLang === "ne" ? "लाइट मोड" : "Light Mode";
    } else {
        body.classList.remove("dark-theme");
        body.classList.add("light-theme");
        themeBtn.textContent = currentLang === "ne" ? "डार्क मोड" : "Dark Mode";
    }
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
    document.documentElement.lang = lang;
    applyTheme(body.classList.contains("dark-theme") ? "dark" : "light");
}

var savedTheme = localStorage.getItem("theme");
var savedLang = localStorage.getItem("lang");
if (savedLang === "ne") { applyLang("ne"); } else { applyLang("en"); }
applyTheme(savedTheme === "dark" ? "dark" : "light");

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

async function fetchNepseIndex() {
    try {
        var response = await fetch('/api/nepse-index');
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var nindex = document.getElementById("nepseIndex");
        nindex.textContent = Number(data["NEPSE Index"].currentValue).toFixed(2);
        var changepercentage = document.getElementById("changePercent");
        var change = document.getElementById("change");
        if (data["NEPSE Index"].close < data["NEPSE Index"].currentValue) {
            nindex.style.color = "#32CD32";
            changepercentage.textContent = Number(-data["NEPSE Index"].perChange).toFixed(2) + "%";
            changepercentage.style.color = "#32CD32";
            change.textContent = Number(-data["NEPSE Index"].change).toFixed(2);
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

async function fetchSubIndices() {
    try {
        var response = await fetch("/api/NepseSubIndices");
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var subindices = Object.values(data);
        var container = document.querySelector(".showindexsub");
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
    } catch (error) { console.error("Subindices error:", error); }
}

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

fetchNepseIndex();
fetchGlobalPrices();
fetchIndexChart();
fetchSubIndices();

/* ===== Visibility API: pause intervals when tab is hidden ===== */
var nepseInterval = setInterval(fetchNepseIndex, 10000);
var pricesInterval = setInterval(fetchGlobalPrices, 60000);

document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
        clearInterval(nepseInterval);
        clearInterval(pricesInterval);
    } else {
        fetchNepseIndex();
        fetchGlobalPrices();
        nepseInterval = setInterval(fetchNepseIndex, 10000);
        pricesInterval = setInterval(fetchGlobalPrices, 60000);
    }
});
