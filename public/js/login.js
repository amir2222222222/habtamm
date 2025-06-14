// public/js/login.js

const togglePasswordBtn = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const loginForm = document.getElementById("loginForm");

togglePasswordBtn.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  togglePasswordBtn.textContent = type === "password" ? "Show" : "Hide";
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = form.username.value;
    const password = form.password.value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.redirected) {
        window.location.href = response.url; // Redirect to dashboard
      } else {
        const text = await response.text();
        alert(text); // Show error or message
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login error. Check console.");
    }
  });
});
