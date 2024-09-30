const fs = require("fs");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const WebSocket = require("ws");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const app = express();
const port = 3000;

app.use(
    fileUpload({
        limits: { fileSize: 30_000_000 }, // No more than 30 MB
        abortOnLimit: true
    })
);
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

function broadcastMessage(message, owner) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ message, owner }));
        }
    });
}

app.delete("/api/avatar", async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.sendStatus(401);

    const user = await users.findOne({ token });
    if (!user) return res.sendStatus(401);

    if (fs.existsSync(`./avatars/${user.username}.webp`)) {
        fs.rmSync(`./avatars/${user.username}.webp`);
    }
    res.sendStatus(200);
});

app.get("/api/avatar", async (req, res) => {
    const { username } = req.query;
    if (!username) return res.sendStatus(400);

    if (!fs.existsSync(`./avatars/${username}.webp`)) {
        return res.sendStatus(204);
    }
    const avatar = await sharp(`./avatars/${username}.webp`).toBuffer();
    res.send(avatar);
});

app.post("/api/avatar/update", async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.sendStatus(401);

    const user = await users.findOne({ token });
    if (!user) return res.sendStatus(401);

    const { image } = req.files;
    if (!image) return res.sendStatus(400);

    if (!/^image/.test(image.mimetype)) return res.sendStatus(400); // Only accept image files

    console.log(image);

    if (image.size > 500_000) return res.sendStatus(413); // No more than 500 Kilobytes

    const webpImage = await sharp(image.data).webp().toBuffer();

    await sharp(webpImage).toFile(`./avatars/${user.username}.webp`);

    res.sendStatus(200);
});

app.get("/api/me", async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.sendStatus(401);

    const user = await users.findOne({ token });
    if (!user) return res.sendStatus(401);

    res.json({ username: user.username });
});

app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username.trim() || !password) return res.sendStatus(400);

    const existingUser = await users.findOne({
        username: username.trim()
    });
    if (existingUser) return res.json({ error: "Username is taken." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = uuidv4();

    await users.insertOne({
        username: username.trim(),
        password: hashedPassword,
        token
    });
    console.log(`User ${username.trim()} has been registered.`);
    res.status(201).json({ token });
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.sendStatus(400);

    const user = await users.findOne({ username });
    if (!user)
        return res.status(401).json({
            error: "Username or password is incorrect."
        });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
        return res.status(200).json({
            error: "Username or password is incorrect."
        });

    // Username and password are correct, so generate a new token
    const newToken = uuidv4();

    await users.updateOne({ username }, { $set: { token: newToken } });
    res.status(200).json({ token: newToken });
});

app.post("/api/message", async (req, res) => {
    const { content } = req.body;

    const token = req.headers.authorization;
    if (!token || !content.trim()) return res.sendStatus(400);

    const user = await users.findOne({ token });
    if (!user) return res.sendStatus(401);

    broadcastMessage(content.trim(), user.username);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}.`);
});
