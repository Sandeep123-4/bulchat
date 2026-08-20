/* Mudraaa Public News - Client JS */

(function () {
    "use strict";

    // === Theme Toggle ===
    var body = document.body;
    var themeBtn = document.getElementById("themeBtn");
    if (themeBtn) {
        var saved = localStorage.getItem("theme");
        if (saved === "dark") {
            body.classList.remove("light-theme");
            body.classList.add("dark-theme");
            themeBtn.textContent = "Light Mode";
        } else {
            body.classList.remove("dark-theme");
            body.classList.add("light-theme");
            themeBtn.textContent = "Dark Mode";
        }
        themeBtn.addEventListener("click", function () {
            var isDark = body.classList.contains("dark-theme");
            var next = isDark ? "light" : "dark";
            localStorage.setItem("theme", next);
            if (next === "dark") {
                body.classList.remove("light-theme");
                body.classList.add("dark-theme");
                themeBtn.textContent = "Light Mode";
            } else {
                body.classList.remove("dark-theme");
                body.classList.add("light-theme");
                themeBtn.textContent = "Dark Mode";
            }
        });
    }

    // === Lazy Load Images ===
    if ("IntersectionObserver" in window) {
        var lazyImages = document.querySelectorAll("img[loading='lazy']");
        var imageObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute("data-src");
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, { rootMargin: "200px" });

        lazyImages.forEach(function (img) { imageObserver.observe(img); });
    }

    // === View Increment (article page only) ===
    var articleEl = document.querySelector("[data-article-id]");
    if (articleEl) {
        var articleId = articleEl.getAttribute("data-article-id");
        if (articleId) {
            // Debounce: only increment once per page load
            var viewed = sessionStorage.getItem("viewed-" + articleId);
            if (!viewed) {
                fetch("/api/news/" + articleId + "/view", { method: "POST" })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (data.success && data.views > 0) {
                            var vc = document.getElementById("viewCount");
                            if (vc) vc.textContent = data.views;
                        }
                    })
                    .catch(function () {});
                sessionStorage.setItem("viewed-" + articleId, "1");
            }
        }
    }

})();
