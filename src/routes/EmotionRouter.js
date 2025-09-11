// src/routes/ai.js
const express = require("express");
const router = express.Router();
const EmotionController = require("../app/controllers/EmotionController");

// CRUD + pagination
router.get("/", EmotionController.getAll); // GET /api/personas?page=1&limit=10
router.get("/:id", EmotionController.getById); // GET /api/personas/:id
router.post("/", EmotionController.create); // POST /api/personas
router.patch("/:id", EmotionController.update); // patch /api/personas/:id
router.delete("/:id", EmotionController.delete); // DELETE /api/personas/:id

module.exports = router;
