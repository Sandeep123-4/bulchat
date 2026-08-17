/* Mudraaa Theme Toggle - Shared */

function initThemeToggle(buttonId) {
    var btn = document.getElementById(buttonId);
    if (!btn) return;

    var body = document.body;

    function applyTheme() {
        var saved = localStorage.getItem("theme");
        if (saved === "light") {
            body.classList.add("light-theme");
            btn.textContent = "Dark Mode";
        } else {
            body.classList.remove("light-theme");
            btn.textContent = "Light Mode";
        }
    }

    btn.addEventListener("click", function () {
        body.classList.toggle("light-theme");
        var isLight = body.classList.contains("light-theme");
        localStorage.setItem("theme", isLight ? "light" : "dark");
        btn.textContent = isLight ? "Dark Mode" : "Light Mode";
        if (window.redrawCharts) {
            window.redrawCharts();
        }
    });

    applyTheme();
}
