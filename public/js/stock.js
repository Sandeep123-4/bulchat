/* Mudraaa Stock Detail */

var symbol = document.body.dataset.symbol;
var nf = new Intl.NumberFormat("en-IN");

function crore(value) {
    var v = Number(value || 0);
    return nf.format(v) + " (" + (v / 10000000).toFixed(2) + " Cr)";
}

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
    if (window.redrawCharts) { window.redrawCharts(); }
});

applyTheme();

async function loadStock() {
    try {
        var response = await fetch("/api/CompanyDetails/" + encodeURIComponent(symbol));
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        var dto = data.securityDailyTradeDto || {};
        var sec = data.security || {};
        var company = sec.companyId || {};
        var ltp = Number(dto.lastTradedPrice || 0);
        var prevClose = Number(dto.previousClose || 0);
        var change = ltp - prevClose;
        var changePercent = prevClose ? (change / prevClose) * 100 : 0;
        var up = change >= 0;

        document.getElementById("ltp").textContent = ltp.toFixed(2);
        document.getElementById("stockName").textContent = sec.securityName || company.companyName || symbol;
        document.getElementById("sectorBadge").textContent =
            (company.sectorMaster && company.sectorMaster.sectorDescription) || sec.instrumentType?.description || "--";

        var pill = document.getElementById("changePill");
        pill.textContent = (up ? "+" : "") + change.toFixed(2) + " (" + (up ? "+" : "") + changePercent.toFixed(2) + "%)";
        pill.classList.remove("hidden", "up", "down");
        pill.classList.add(up ? "up" : "down");

        var updated = document.getElementById("updatedAt");
        updated.classList.remove("hidden");
        updated.textContent = dto.lastUpdatedDateTime
            ? "Updated " + new Date(dto.lastUpdatedDateTime).toLocaleString()
            : (dto.businessDate || "");

        document.getElementById("sOpen").textContent = Number(dto.openPrice || 0).toFixed(2);
        document.getElementById("sHigh").textContent = Number(dto.highPrice || 0).toFixed(2);
        document.getElementById("sLow").textContent = Number(dto.lowPrice || 0).toFixed(2);
        document.getElementById("sPrev").textContent = prevClose.toFixed(2);
        document.getElementById("sVolume").textContent = nf.format(Number(dto.totalTradeQuantity || 0));
        document.getElementById("sTrades").textContent = nf.format(Number(dto.totalTrades || 0));
        document.getElementById("s52High").textContent = Number(dto.fiftyTwoWeekHigh || 0).toFixed(2);
        document.getElementById("s52Low").textContent = Number(dto.fiftyTwoWeekLow || 0).toFixed(2);

        document.getElementById("cSector").textContent = (company.sectorMaster && company.sectorMaster.sectorDescription) || "--";
        document.getElementById("cFace").textContent = Number(sec.faceValue || 0).toFixed(0) + " NPR";
        document.getElementById("cMarketCap").textContent = crore(data.marketCapitalization);
        document.getElementById("cPaidUp").textContent = crore(data.paidUpCapital);
        document.getElementById("cListed").textContent = nf.format(Number(data.stockListedShares || 0));
        document.getElementById("cIsin").textContent = sec.isin || "--";
        document.getElementById("cListing").textContent = sec.listingDate ? new Date(sec.listingDate).toLocaleDateString() : "--";

        var website = document.getElementById("cWebsite");
        if (company.companyWebsite) {
            var url = company.companyWebsite.startsWith("http") ? company.companyWebsite : "http://" + company.companyWebsite;
            website.innerHTML = '<a href="' + url + '" target="_blank" rel="noopener">' + company.companyWebsite + '</a>';
        } else {
            website.textContent = "--";
        }

        var pub = Number(data.publicPercentage || 0);
        var pro = Number(data.promoterPercentage || 0);
        var total = pub + pro || 100;
        document.getElementById("publicBar").style.flex = (pub / total) + " 1 0%";
        document.getElementById("promoterBar").style.flex = (pro / total) + " 1 0%";
        document.getElementById("publicPct").textContent = pub.toFixed(2) + "%";
        document.getElementById("promoterPct").textContent = pro.toFixed(2) + "%";
    } catch (error) {
        console.error("Stock API error:", error);
        document.getElementById("ltp").textContent = "Unavailable";
        document.getElementById("sectorBadge").textContent = "--";
    }
}
loadStock();

async function loadPriceGraph() {
    try {
        var response = await fetch("/api/DailyScripPriceGraph?symbol=" + encodeURIComponent(symbol));
        if (!response.ok) throw new Error("HTTP " + response.status);
        var data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            document.getElementById("chartEmpty").classList.remove("hidden");
            return;
        }
        var labels = data.map(function (p) {
            return new Date(p.time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        });
        var values = data.map(function (p) { return Number(p.contractRate ?? 0); });
        drawLineChart("priceChart", labels, values);
    } catch (error) {
        console.error("Price graph error:", error);
        document.getElementById("chartEmpty").classList.remove("hidden");
    }
}
loadPriceGraph();
