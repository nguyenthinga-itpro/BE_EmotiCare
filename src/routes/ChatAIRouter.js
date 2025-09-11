// src/routes/ai.js
const express = require("express");
const router = express.Router();
const ChatAIController = require("../app/controllers/ChatAIController");

router.post("/chat", ChatAIController.chat); //Create ChatBox
// CRUD + pagination
router.get("/", ChatAIController.list); // GET /api/personas?page=1&limit=10
router.get("/:id", ChatAIController.get); // GET /api/personas/:id
router.post("/", ChatAIController.create); // POST /api/personas
router.patch("/:id", ChatAIController.update); // patch /api/personas/:id
router.delete("/:id", ChatAIController.delete); // DELETE /api/personas/:id

module.exports = router;
