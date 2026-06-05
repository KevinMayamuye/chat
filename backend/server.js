import connectDB from "./config/db.js";

import express from "express";
import cors from "cors";

import http from "http";
import { Server } from "socket.io";

import { initSocket } from "./socket/socketManager.js";
import socketAuth from "./socket/socketAuth.js";
import {
  setUserOnline,
  setUserOffline,
} from "./socket/userStatus.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import { FRONTEND_URL, PORT } from "./config/env.js";

const app = express();

app.use(cors({
  origin: true || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("server is running");
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: true || "http://localhost:5173",
    credentials: true,
  },
});

// Make io available throughout the app
initSocket(io);

io.use(socketAuth);

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  socket.join(socket.data.userId);

  await setUserOnline(socket.data.userId);

  console.log(
    `User ${socket.data.userId} joined room`
  );

  socket.emit("connected");

  socket.on("disconnect", async () => {
    console.log(
      "User disconnected:",
      socket.id
    );

    await setUserOffline(socket.data.userId);
  });
});

// Connect Database
connectDB();

// Start Server
server.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT}`
  );
});