// src/routes/ai.js
const express = require("express");
const router = express.Router();
const ChatAIController = require("../app/controllers/ChatAIController");

// CRUD + pagination
router.get("/", ChatAIController.getAllChats); // GET /api/personas?page=1&limit=10
router.get("/:id", ChatAIController.getChatById); // GET /api/personas/:id
router.post("/", ChatAIController.createChat); // POST /api/personas
router.patch("/:id", ChatAIController.updateChat); // patch /api/personas/:id
router.patch("/:id/status", ChatAIController.toggleChatStatus); // patch /api/personas/:id
router.post("/sendMessage", ChatAIController.sendMessage);

module.exports = router;
