const registerForm = document.querySelector("#register-form");
const usernameInput = document.querySelector("#username-input");
const passwordInput = document.querySelector("#password-input");
const confirmPasswordInput = document.querySelector("#confirm-password-input");

registerForm.onsubmit = (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        alert("Username and password are required.");
        return;
    }

    if (password !== confirmPasswordInput.value) {
        alert("Passwords do not match.");
        return;
    }

    register(username, password);
};

async function register(username, password) {
    const response = await fetch("http://192.168.1.94:3000/api/register", {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();

    if (data.error) {
        alert(data.error);
    } else {
        localStorage.setItem("token", data.token);
        window.location.href = "/";
    }
}
