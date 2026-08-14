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
        const gridColor = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)";
        const tickColor = isLight ? "#6b7280" : "#8b949e";

        const pad = { top: 12, right: 12, bottom: 24, left: 48 };
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
        ctx.font = "10px Inter, sans-serif";

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (ch * i) / 4;

            ctx.strokeStyle = gridColor;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + cw, y);
            ctx.stroke();

            const val = max - (span * i) / 4;

            ctx.fillStyle = tickColor;
            ctx.fillText(Number(val).toFixed(val >= 1000 ? 0 : 1), pad.left - 8, y);
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const steps = Math.min(6, n);

        for (let i = 0; i < steps; i++) {
            const idx = Math.round((i * (n - 1)) / (steps - 1 || 1));
            const x = pad.left + (cw * idx) / (n - 1);

            ctx.fillStyle = tickColor;
            ctx.fillText(labels[idx] || "", x, h - 18);
        }

        function xAt(i) {
            return pad.left + (cw * i) / (n - 1);
        }

        function yAt(v) {
            return pad.top + ch * (1 - (v - min) / span);
        }

        const up = values[n - 1] >= values[0];
        const color = up ? "#2EA043" : "#dc2626";

        ctx.beginPath();
        ctx.moveTo(xAt(0), yAt(values[0]));

        for (let i = 1; i < n; i++) ctx.lineTo(xAt(i), yAt(values[i]));

        ctx.lineTo(xAt(n - 1), h - pad.bottom);
        ctx.lineTo(xAt(0), h - pad.bottom);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
        grad.addColorStop(0, up ? "rgba(46,160,67,0.30)" : "rgba(220,38,38,0.30)");
        grad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(xAt(0), yAt(values[0]));

        for (let i = 1; i < n; i++) ctx.lineTo(xAt(i), yAt(values[i]));

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
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

            window.addEventListener("resize", function () {
                window.redrawCharts();
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
