// src/routes/ai.js
const express = require("express");
const router = express.Router();
const ChatSessionController = require("../app/controllers/ChatSessionController");

// CRUD + pagination
router.get("/", ChatSessionController.getAll); // GET /api/personas?page=1&limit=10
router.get("/:id", ChatSessionController.getById); // GET /api/personas/:id
router.post("/", ChatSessionController.create); // POST /api/personas
router.patch("/:id", ChatSessionController.update); // patch /api/personas/:id
router.delete("/:id", ChatSessionController.delete); // DELETE /api/personas/:id

module.exports = router;
