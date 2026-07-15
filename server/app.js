import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import uploadRouter from "./routes/upload.js";
import chatRouter from "./routes/chat.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PDF RAG Chatbot API is running 🚀",
  });
});

// Routes
app.use("/api/upload", uploadRouter);
app.use("/api/chat", chatRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
});

export default app;