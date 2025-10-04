// routes/chatSessions.js
const express = require("express");
const router = express.Router();
const ChatSessionController = require("../app/controllers/ChatSessionController");
router.get("/", ChatSessionController.getAllSessions);
// Tạo session mới
router.post("/create", ChatSessionController.createSession);

// Gửi message vào session
router.post("/:sessionId/sendMessage", ChatSessionController.sendMessage);

// Lấy thông tin session
router.get("/:sessionId", ChatSessionController.getSessionById);

// Realtime subscribe session
router.get("/:sessionId/subscribe", ChatSessionController.subscribeSession);

module.exports = router;
