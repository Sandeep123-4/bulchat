/* Mudraaa Shared Notifications — included on every authenticated page */

(function () {
    // 1. Request notification permission once
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    // 2. Show browser notification
    function notify(title, body) {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body: body, icon: "/img/logo.svg" });
        }
    }

    // 3. Show in-app toast
    function toast(message) {
        var el = document.createElement("div");
        el.style.cssText = "position:fixed;top:20px;right:20px;padding:14px 22px;background:linear-gradient(135deg,#238636,#2EA043);color:#fff;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 6px 20px rgba(46,160,67,.4);z-index:9999;max-width:360px;word-break:break-word;";
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 4000);
    }

    // 4. Connect Socket.IO
    var socket = io();

    // 5. NEPSE 5-point alert (server pushes this to ALL connected users)
    socket.on("nepse-alert", function (data) {
        notify("NEPSE Alert", data.message);
        toast(data.message);
    });

    // Expose toast globally so other scripts can use it
    window.showToast = toast;
    window.showBrowserNotification = notify;
})();
