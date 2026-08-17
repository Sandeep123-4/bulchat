/* Mudraaa Auth - Signup Email Validation */

(function () {
    var emailInput = document.getElementById("emailInput");
    var emailStatus = document.getElementById("emailStatus");
    var form = document.querySelector("form");

    if (!emailInput || !emailStatus || !form) return;

    var emailExists = false;

    async function checkEmail(email) {
        if (!email) {
            emailStatus.textContent = "";
            emailStatus.className = "email-status";
            return;
        }

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
    }

    var debounce;

    emailInput.addEventListener("input", function () {
        clearTimeout(debounce);
        debounce = setTimeout(function () {
            checkEmail(emailInput.value.trim());
        }, 500);
    });

    emailInput.addEventListener("blur", function () {
        checkEmail(emailInput.value.trim());
    });

    form.addEventListener("submit", function (e) {
        if (emailExists) {
            e.preventDefault();
            emailStatus.textContent = "This email is already registered";
            emailStatus.className = "email-status error";
            emailInput.focus();
        }
    });
})();
