// src/routes/ai.js
const express = require("express");
const router = express.Router();
const ConversationHistoryController = require("../app/controllers/ConversationHistoryController");

// CRUD + pagination
router.get("/", ConversationHistoryController.getAll); // GET /api/personas?page=1&limit=10
router.get("/:id", ConversationHistoryController.getById); // GET /api/personas/:id
router.post("/", ConversationHistoryController.create); // POST /api/personas
router.patch("/:id", ConversationHistoryController.update); // patch /api/personas/:id
router.delete("/:id", ConversationHistoryController.delete); // DELETE /api/personas/:id

module.exports = router;
