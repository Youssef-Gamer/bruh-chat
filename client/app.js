const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const messageList = document.querySelector("#messages");

const token = localStorage.getItem("token");

let lastMessageOwner;

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
    receiveMessage(JSON.parse(message));
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
    const { message: content, owner } = message;

    // root div
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageList.appendChild(messageElement);

    // We don't want to repeat the owner's username for every single message they send.
    // Only show the owner's username if it's different from the previous message's owner.
    // - Copium
    if (owner !== lastMessageOwner) {
        messageElement.style.marginTop = "12px";
        
        // username h3
        const usernameElement = document.createElement("h3");
        usernameElement.textContent = owner;
        usernameElement.classList.add("username");
        messageElement.appendChild(usernameElement);
    }
    lastMessageOwner = owner;
    // message span
    const messageContentElement = document.createElement("span");
    messageContentElement.textContent = content;
    messageContentElement.classList.add("message-content");
    messageElement.appendChild(messageContentElement);
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
