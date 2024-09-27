const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const client = new MongoClient("mongodb://localhost:27017");
let users;

client
    .connect()
    .then(() => {
        users = client.db("chatApp").collection("users");
        console.log("Connected to MongoDB!");
    })
    .catch((err) => console.error("MongoDB connection error:", err));

const wss = new WebSocket.Server({ port: 3001 });

wss.on("connection", (ws) => {
    console.log(`Client connected. (${ws._socket.remoteAddress}:${ws._socket.remotePort})`);
    ws.on("close", () => {
        console.log(`Client disconnected. (${ws._socket.remoteAddress}:${ws._socket.remotePort})`);
    });
});

function broadcastMessage(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

app.get("/api/me", async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        res.sendStatus(401);
        return;
    }

    const user = await users.findOne({ token });
    if (!user) {
        res.sendStatus(401);
        return;
    }

    res.json({ username: user.username });
});

app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.sendStatus(400);
        return;
    }

    const existingUser = await users.findOne({ username });
    if (existingUser) {
        res.json({ error: "Username is taken." });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = uuidv4();

    await users.insertOne({ username, password: hashedPassword, token });
    console.log(`User ${username} has been registered.`);
    res.status(201).json({ token });
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.sendStatus(400);
        return;
    }

    const user = await users.findOne({ username });
    if (!user) {
        res.status(200).json({ error: "Username or password is incorrect." });
        return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        res.status(200).json({ error: "Username or password is incorrect." });
        return;
    }

    // Username and password are correct, so generate a new token
    const newToken = uuidv4();

    await users.updateOne({ username }, { $set: { token: newToken } });
    res.status(200).json({ token: newToken });
});

app.post("/api/message", async (req, res) => {
    const { content } = req.body;
    const token = req.headers.authorization;

    if (!token || !content) {
        res.sendStatus(400);
        return;
    }

    const user = await users.findOne({ token });
    if (!user) {
        res.sendStatus(401);
        return;
    }

    broadcastMessage(`${user.username}: ${content}`);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}.`);
});
