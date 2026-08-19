/* Mudraaa Auth - Signup with OTP Verification */

(function () {

    /* ===== Signup Step 1 → Send OTP ===== */
    var signupForm = document.getElementById("signupForm");
    var emailInput = document.getElementById("emailInput");
    var emailStatus = document.getElementById("emailStatus");
    var sendOtpBtn = document.getElementById("sendOtpBtn");

    if (signupForm) {
        var emailExists = false;
        var emailCheckTimeout;

        async function checkEmail(email) {
            if (!email) { emailStatus.textContent = ""; emailStatus.className = "email-status"; return; }
            try {
                var res = await fetch("/api/check-email?email=" + encodeURIComponent(email));
                var data = await res.json();
                emailExists = data.exists;
                if (data.exists) {
                    emailStatus.textContent = "This email is already registered";
                    emailStatus.className = "email-status error";
                } else {
                    emailStatus.textContent = "Email is available";
                    emailStatus.className = "email-status ok";
                }
            } catch (e) {
                emailStatus.textContent = "";
                emailStatus.className = "email-status";
            }
        }

        emailInput.addEventListener("input", function () {
            clearTimeout(emailCheckTimeout);
            emailCheckTimeout = setTimeout(function () { checkEmail(emailInput.value.trim()); }, 500);
        });
        emailInput.addEventListener("blur", function () { checkEmail(emailInput.value.trim()); });

        signupForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            if (emailExists) {
                emailStatus.textContent = "This email is already registered";
                emailStatus.className = "email-status error";
                emailInput.focus();
                return;
            }

            var username = document.getElementById("usernameInput").value.trim();
            var email = emailInput.value.trim();
            var password = document.getElementById("passwordInput").value;

            if (!username || !email || !password) return;

            sendOtpBtn.disabled = true;
            sendOtpBtn.textContent = "Sending code...";

            try {
                var res = await fetch("/api/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: username, email: email, password: password })
                });
                var data = await res.json();

                if (!res.ok) {
                    emailStatus.textContent = data.error || "Failed to send OTP";
                    emailStatus.className = "email-status error";
                    sendOtpBtn.disabled = false;
                    sendOtpBtn.textContent = "Send Verification Code";
                    return;
                }

                showStep(2);
                document.getElementById("otpEmailDisplay").textContent = email;
                document.getElementById("otpInputs").querySelector("input").focus();
                startResendTimer();

                if (data._devOtp) {
                    otpError.innerHTML = 'Email send failed (dev mode). Your OTP: <strong style="user-select:all;-webkit-user-select:all;cursor:pointer;" onclick="navigator.clipboard.writeText(\'' + data._devOtp + '\')">' + data._devOtp + '</strong> <span style="font-size:10px;opacity:0.6;">(click to copy)</span>';
                    otpError.style.color = "#2EA043";
                }
            } catch (err) {
                emailStatus.textContent = "Network error. Please try again.";
                emailStatus.className = "email-status error";
                sendOtpBtn.disabled = false;
                sendOtpBtn.textContent = "Send Verification Code";
            }
        });
    }

    /* ===== OTP Input Boxes ===== */
    var otpInputs = document.querySelectorAll(".otp-box");
    if (otpInputs.length) {
        otpInputs.forEach(function (box, i) {
            box.addEventListener("input", function () {
                this.value = this.value.replace(/[^0-9]/g, "");
                if (this.value && i < otpInputs.length - 1) {
                    otpInputs[i + 1].focus();
                }
            });
            box.addEventListener("keydown", function (e) {
                if (e.key === "Backspace" && !this.value && i > 0) {
                    otpInputs[i - 1].focus();
                    otpInputs[i - 1].value = "";
                }
                if (e.key === "ArrowLeft" && i > 0) otpInputs[i - 1].focus();
                if (e.key === "ArrowRight" && i < otpInputs.length - 1) otpInputs[i + 1].focus();
            });
            box.addEventListener("paste", function (e) {
                e.preventDefault();
                var pasted = (e.clipboardData || window.clipboardData).getData("text").replace(/[^0-9]/g, "").slice(0, 6);
                for (var j = 0; j < pasted.length && j < otpInputs.length; j++) {
                    otpInputs[j].value = pasted[j];
                }
                var focusIdx = Math.min(pasted.length, otpInputs.length - 1);
                otpInputs[focusIdx].focus();
            });
        });
    }

    /* ===== Signup Step 2 → Verify OTP ===== */
    var otpForm = document.getElementById("otpForm");
    var otpError = document.getElementById("otpError");
    var verifyOtpBtn = document.getElementById("verifyOtpBtn");

    if (otpForm) {
        otpForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            otpError.textContent = "";

            var otp = "";
            otpInputs.forEach(function (box) { otp += box.value; });

            if (otp.length !== 6) {
                otpError.textContent = "Please enter the complete 6-digit code";
                return;
            }

            var username = document.getElementById("usernameInput").value.trim();
            var email = emailInput.value.trim();
            var password = document.getElementById("passwordInput").value;

            verifyOtpBtn.disabled = true;
            verifyOtpBtn.textContent = "Verifying...";

            try {
                var res = await fetch("/api/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: username, email: email, password: password, otp: otp })
                });
                var data = await res.json();

                if (!res.ok) {
                    otpError.textContent = data.error || "Invalid OTP";
                    verifyOtpBtn.disabled = false;
                    verifyOtpBtn.textContent = "Verify & Create Account";
                    otpInputs.forEach(function (box) { box.value = ""; });
                    otpInputs[0].focus();
                    return;
                }

                showStep(3);
            } catch (err) {
                otpError.textContent = "Network error. Please try again.";
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.textContent = "Verify & Create Account";
            }
        });
    }

    /* ===== Resend Timer ===== */
    var resendTimer;
    function startResendTimer() {
        var seconds = 60;
        var timerEl = document.getElementById("otpTimer");
        var resendBtn = document.getElementById("resendBtn");
        if (!timerEl || !resendBtn) return;

        resendBtn.style.display = "none";
        timerEl.style.display = "inline";

        clearInterval(resendTimer);
        resendTimer = setInterval(function () {
            seconds--;
            if (seconds <= 0) {
                clearInterval(resendTimer);
                timerEl.style.display = "none";
                resendBtn.style.display = "inline";
                return;
            }
            timerEl.innerHTML = "Resend code in <strong>" + seconds + "s</strong>";
        }, 1000);
    }

    var resendBtn = document.getElementById("resendBtn");
    if (resendBtn) {
        resendBtn.addEventListener("click", async function () {
            var username = document.getElementById("usernameInput").value.trim();
            var email = emailInput.value.trim();
            var password = document.getElementById("passwordInput").value;

            resendBtn.disabled = true;
            resendBtn.textContent = "Sending...";

            try {
                var res = await fetch("/api/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: username, email: email, password: password })
                });
                var data = await res.json();

                if (res.ok) {
                    otpError.textContent = "";
                    otpError.style.color = "";
                    otpInputs.forEach(function (box) { box.value = ""; });
                    otpInputs[0].focus();
                    startResendTimer();
                    if (data._devOtp) {
                        otpError.innerHTML = 'Your OTP: <strong style="user-select:all;-webkit-user-select:all;cursor:pointer;" onclick="navigator.clipboard.writeText(\'' + data._devOtp + '\')">' + data._devOtp + '</strong> <span style="font-size:10px;opacity:0.6;">(click to copy)</span>';
                        otpError.style.color = "#2EA043";
                    }
                } else {
                    otpError.textContent = data.error || "Failed to resend";
                    otpError.style.color = "#dc2626";
                }
            } catch (err) {
                otpError.textContent = "Network error";
                otpError.style.color = "#dc2626";
            }

            resendBtn.disabled = false;
            resendBtn.textContent = "Resend Code";
        });
    }

    /* ===== Back to Step 1 ===== */
    var backBtn = document.getElementById("backToStep1");
    if (backBtn) {
        backBtn.addEventListener("click", function (e) {
            e.preventDefault();
            showStep(1);
            otpError.textContent = "";
            otpInputs.forEach(function (box) { box.value = ""; });
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = "Send Verification Code";
            clearInterval(resendTimer);
        });
    }

    /* ===== Step Navigation ===== */
    function showStep(step) {
        document.querySelectorAll(".auth-step").forEach(function (el) { el.classList.remove("active"); });
        var target = document.getElementById("step" + step);
        if (target) target.classList.add("active");
    }

})();
