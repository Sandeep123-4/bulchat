/* Mudraaa Shared Notifications — included on every authenticated page */

(function () {
    var swRegistration = null;

    // 1. Register service worker for background notifications
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").then(function (reg) {
            swRegistration = reg;
        }).catch(function (err) {
            console.warn("Service worker registration failed:", err);
        });
    }

    // 2. Request notification permission once
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    // 3. Show notification (service worker first, fallback to basic Notification)
    function notify(title, body) {
        if (!("Notification" in window)) return;

        if (swRegistration && Notification.permission === "granted") {
            swRegistration.showNotification(title, {
                body: body,
                icon: "/img/logo.svg",
                badge: "/img/logo.svg",
                tag: "mudraa-" + Date.now(),
                renotify: true,
                vibrate: [200, 100, 200]
            });
        } else if (Notification.permission === "granted") {
            try {
                new Notification(title, { body: body, icon: "/img/logo.svg" });
            } catch (e) {
                console.warn("Browser notification failed:", e);
            }
        }
    }

    // 4. Show in-app toast
    function toast(message) {
        var el = document.createElement("div");
        el.style.cssText = "position:fixed;top:20px;right:20px;padding:14px 22px;background:linear-gradient(135deg,#238636,#2EA043);color:#fff;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 6px 20px rgba(46,160,67,.4);z-index:9999;max-width:360px;word-break:break-word;cursor:pointer;";
        el.textContent = message;
        el.title = "Click to dismiss";
        el.addEventListener("click", function () { el.remove(); });
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 4000);
    }

    // 5. Show blocked-permission banner (only once per session)
    function showBlockedBanner() {
        if ("Notification" in window && Notification.permission === "denied") {
            if (sessionStorage.getItem("notif-banner-shown")) return;
            sessionStorage.setItem("notif-banner-shown", "1");
            var banner = document.createElement("div");
            banner.style.cssText = "position:fixed;bottom:20px;right:20px;padding:12px 20px;background:#da3633;color:#fff;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 14px rgba(218,54,51,.4);z-index:9999;max-width:360px;word-break:break-word;cursor:pointer;";
            banner.textContent = "Browser notifications are blocked. Click to re-enable.";
            banner.title = "Click to request permission";
            banner.addEventListener("click", function () {
                if ("Notification" in window) {
                    Notification.requestPermission().then(function (perm) {
                        if (perm === "granted") {
                            banner.style.background = "#238636";
                            banner.textContent = "Notifications enabled!";
                            setTimeout(function () { banner.remove(); }, 2000);
                        }
                    });
                }
            });
            document.body.appendChild(banner);
        }
    }

    setTimeout(showBlockedBanner, 2000);

    // 6. Connect Socket.IO
    var socket = io();

    // 7. NEPSE 5-point alert (server pushes this to ALL connected users)
    socket.on("nepse-alert", function (data) {
        notify("NEPSE Alert", data.message);
        toast(data.message);
    });

    // 8. Chat message alert (works on every page)
    var myUsername = (document.querySelector('meta[name="username"]') || {}).content || "";
    socket.on("chat message", function (data) {
        if (data.username && data.username !== myUsername) {
            notify(data.username + " says:", data.message);
            toast(data.username + ": " + data.message);
        }
    });

    socket.on("connect_error", function (err) {
        console.warn("Notification socket connection error:", err.message);
    });

    // Expose globals so other scripts can reuse them
    window.showToast = toast;
    window.showBrowserNotification = notify;
    window.notificationSocket = socket;
})();
