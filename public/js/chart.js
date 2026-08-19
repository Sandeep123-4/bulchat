(function (window) {
    function draw(canvas, labels, values) {
        const wrap = canvas.parentElement;

        if (!wrap || wrap.clientWidth === 0 || wrap.clientHeight === 0) return;

        const dpr = window.devicePixelRatio || 1;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";

        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);

        const n = values.length;
        if (n < 2) return;

        const isLight = document.body.classList.contains("light-theme");
        const gridColor = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)";
        const tickColor = isLight ? "#8b949e" : "#484f58";
        const labelColor = isLight ? "#6b7280" : "#7d8590";

        const pad = { top: 16, right: 16, bottom: 32, left: 56 };
        const cw = w - pad.left - pad.right;
        const ch = h - pad.top - pad.bottom;

        if (cw <= 0 || ch <= 0) return;

        let min = Math.min.apply(null, values);
        let max = Math.max.apply(null, values);
        const range = max - min || 1;
        min -= range * 0.08;
        max += range * 0.08;
        const span = max - min;

        ctx.clearRect(0, 0, w, h);

        /* Grid lines */
        ctx.font = "11px Inter, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= 5; i++) {
            const y = pad.top + (ch * i) / 5;

            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + cw, y);
            ctx.stroke();

            const val = max - (span * i) / 5;
            ctx.fillStyle = tickColor;
            ctx.fillText(Number(val).toFixed(val >= 1000 ? 0 : 1), pad.left - 10, y);
        }

        /* X-axis labels */
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const steps = Math.min(7, n);
        for (let i = 0; i < steps; i++) {
            const idx = Math.round((i * (n - 1)) / (steps - 1 || 1));
            const x = pad.left + (cw * idx) / (n - 1);
            ctx.fillStyle = labelColor;
            ctx.fillText(labels[idx] || "", x, h - 22);
        }

        function xAt(i) { return pad.left + (cw * i) / (n - 1); }
        function yAt(v) { return pad.top + ch * (1 - (v - min) / span); }

        const up = values[n - 1] >= values[0];
        const lineColor = up ? "#2EA043" : "#dc2626";
        const fillTop = up ? "rgba(46,160,67,0.22)" : "rgba(220,38,38,0.22)";

        /* Gradient fill under the line */
        ctx.beginPath();
        ctx.moveTo(xAt(0), yAt(values[0]));
        for (let i = 1; i < n; i++) ctx.lineTo(xAt(i), yAt(values[i]));
        ctx.lineTo(xAt(n - 1), h - pad.bottom);
        ctx.lineTo(xAt(0), h - pad.bottom);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
        grad.addColorStop(0, fillTop);
        grad.addColorStop(0.6, fillTop.replace(/[\d.]+\)$/, "0.04)"));
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fill();

        /* Line */
        ctx.beginPath();
        ctx.moveTo(xAt(0), yAt(values[0]));
        for (let i = 1; i < n; i++) {
            const xc = (xAt(i - 1) + xAt(i)) / 2;
            const yc = (yAt(values[i - 1]) + yAt(values[i])) / 2;
            ctx.quadraticCurveTo(xAt(i - 1), yAt(values[i - 1]), xc, yc);
        }
        ctx.lineTo(xAt(n - 1), yAt(values[n - 1]));

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();

        /* End dot */
        const lastX = xAt(n - 1);
        const lastY = yAt(values[n - 1]);
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    window.drawLineChart = function (canvasId, labels, values) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        draw(canvas, labels, values);

        canvas._chartData = {
            labels: labels.slice(),
            values: values.slice()
        };

        if (!window._chartResizeBound) {
            window._chartResizeBound = true;
            var resizeTimer;
            window.addEventListener("resize", function () {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () { window.redrawCharts(); }, 150);
            });
        }
    };

    window.redrawCharts = function () {
        document.querySelectorAll("canvas").forEach(function (c) {
            if (c._chartData) {
                draw(c, c._chartData.labels, c._chartData.values);
            }
        });
    };
})(window);
