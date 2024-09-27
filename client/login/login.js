const loginForm = document.querySelector("#login-form");
const usernameInput = document.querySelector("#username-input");
const passwordInput = document.querySelector("#password-input");

loginForm.onsubmit = (event) => {
    event.preventDefault();

    const username = usernameInput.value;
    const password = passwordInput.value;
    if (!username || !password) {
        alert("Username and password are required.");
        return;
    }
    login(username, password);
};

async function login(username, password) {
    const response = await fetch("http://192.168.1.94:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
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
