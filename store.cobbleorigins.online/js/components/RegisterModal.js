window.RegisterModal = {
  init() {
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleRegister();
      });
    }
  },

  onCaptchaSuccess() {
    const submitBtn = document.getElementById("register-submit-btn");
    if (submitBtn) submitBtn.disabled = false;
  },

  onCaptchaExpired() {
    const submitBtn = document.getElementById("register-submit-btn");
    if (submitBtn) submitBtn.disabled = true;
  },

  togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector("i");
    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  },

  async handleRegister() {
    const usernameInput = document.getElementById("register-username");
    const passwordInput = document.getElementById("register-password");
    const confirmInput = document.getElementById("register-confirm-password");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const confirm = confirmInput.value.trim();

    const usernameRegex = /^[a-zA-Z0-9_.]{3,16}$/;

    [usernameInput, passwordInput, confirmInput].forEach((el) =>
      el.classList.remove("error"),
    );

    let hasError = false;
    if (!username || !usernameRegex.test(username)) {
      usernameInput.classList.add("error");
      Toast.error(
        "ชื่อตัวละครไม่ถูกต้อง",
        "ต้องมี 3-16 ตัวอักษร และใช้ได้เฉพาะ A-Z, 0-9, _, .",
      );
      hasError = true;
    }
    if (!password) {
      passwordInput.classList.add("error");
      hasError = true;
    }
    if (!confirm) {
      confirmInput.classList.add("error");
      hasError = true;
    }

    if (hasError) {
      Toast.error("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (password !== confirm) {
      passwordInput.classList.add("error");
      confirmInput.classList.add("error");
      Toast.error("รหัสผ่านไม่ตรงกัน", "กรุณาตรวจสอบการกรอกรหัสผ่านอีกครั้ง");
      return;
    }

    if (password.length < 6) {
      passwordInput.classList.add("error");
      Toast.error(
        "รหัสผ่านสั้นเกินไป",
        "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      );
      return;
    }

    let captchaToken = "";
    const recaptchaEl = document.getElementById("recaptcha-enabled");
    const isRecaptchaEnabled = recaptchaEl && recaptchaEl.value === "1";

    if (isRecaptchaEnabled) {
      if (typeof grecaptcha !== "undefined") {
        captchaToken = grecaptcha.getResponse();
        if (!captchaToken) {
          Toast.error(
            "ยืนยันตัวตนไม่สำเร็จ",
            "กรุณาติ๊กถูกที่ช่องสี่เหลี่ยม reCAPTCHA",
          );
          return;
        }
      }
    }

    const submitBtn = document.querySelector("#register-form .rm5-submit-btn");
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i> กำลังดำเนินการ...';

    try {
      const response = await fetch(
        `${window.App.apiBase}/auth.php?action=register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            captcha_token: captchaToken,
          }),
        },
      );
      const data = await response.json();

      if (data.success) {
        Toast.success("สมัครสมาชิกสำเร็จ", `ยินดีต้อนรับ คุณ ${username} !!`);

        window.closeModal("register-modal");

        if (data.user && window.Auth) {
          window.App.user = data.user;
          sessionStorage.setItem("user", JSON.stringify(data.user));

          window.Auth.updateUI();

          if (window.Router) {
            setTimeout(() => {
              window.Router.loadPage(window.Router.currentPage);
            }, 800);
          }
        } else {
          setTimeout(() => {
            window.openModal("login-modal");
          }, 1000);
        }

        const regForm = document.getElementById("register-form");
        if (regForm) regForm.reset();
      } else {
        Toast.error("สมัครสมาชิกไม่สำเร็จ", data.message);
      }
    } catch (error) {
      console.error("Register execution error:", error);
      Toast.error("เกิดข้อผิดพลาด", "ไม่สามารถประมวลผลการลงทะเบียนได้");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  window.RegisterModal.init();
});
