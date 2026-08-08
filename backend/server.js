require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const boardRoutes = require("./routes/boards");

const app = express();
const server = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST", "PATCH", "DELETE"] }
});

app.set("io", io);
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);

// boardId -> Map(socketId -> { id, name })
const presence = {};

function getPresenceList(boardId) {
  const map = presence[boardId];
  if (!map) return [];
  return Array.from(map.values());
}

io.on("connection", (socket) => {
  socket.on("join-board", ({ boardId, user }) => {
    if (!boardId) return;
    socket.join(`board:${boardId}`);
    socket.data.boardId = boardId;
    socket.data.user = user;

    if (!presence[boardId]) presence[boardId] = new Map();
    presence[boardId].set(socket.id, user || { id: socket.id, name: "Guest" });

    io.to(`board:${boardId}`).emit("presence:update", getPresenceList(boardId));
  });

  socket.on("disconnect", () => {
    const boardId = socket.data.boardId;
    if (boardId && presence[boardId]) {
      presence[boardId].delete(socket.id);
      io.to(`board:${boardId}`).emit("presence:update", getPresenceList(boardId));
    }
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/teamsync";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
