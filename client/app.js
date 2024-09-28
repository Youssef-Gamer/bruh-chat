const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const messageList = document.querySelector("#messages");

const token = localStorage.getItem("token");

if (token) {
    document.querySelector("#login-button").style.display = "none";
    document.querySelector("#logout-button").style.display = "";

    getUsername().then((username) => {
        document.querySelector("#username").textContent = username;
        document.querySelector("h3").style.display = "";
    });
} else {
    // set the message input the disabled
    messageInput.disabled = true;
    messageInput.placeholder = "You must be logged in to send messages!";
}

const ip = "ws://192.168.1.94:3001";
const ws = new WebSocket(ip);

ws.onmessage = (event) => {
    const message = event.data;
    receiveMessage(message);
};

messageForm.onsubmit = (event) => {
    event.preventDefault(); // Prevent page refresh

    const message = messageInput.value;
    messageInput.value = "";

    if (message) sendMessage(message);
};

async function getUsername() {
    const response = await fetch("http://192.168.1.94:3000/api/me", {
        method: "GET",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            Authorization: token
        }
    });
    const data = await response.json();
    return data.username;
}

function receiveMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageList.appendChild(messageElement);
}

function sendMessage(message) {
    fetch("http://192.168.1.94:3000/api/message", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            Authorization: token
        },
        body: JSON.stringify({ content: message })
    }).catch((error) => {
        console.error(`Failed to send message: ${error}`);
    });
}
