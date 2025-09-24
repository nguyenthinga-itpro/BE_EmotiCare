// src/routes/ai.js
const express = require("express");
const router = express.Router();
const EmotionController = require("../app/controllers/EmotionController");

// CRUD + pagination
router.get("/", EmotionController.getAllEmotions); // GET /api/personas?page=1&limit=10
router.get("/:id", EmotionController.getEmotionById); // GET /api/personas/:id
router.post("/", EmotionController.createEmotion); // POST /api/personas
router.patch("/:id", EmotionController.updateEmotion); // patch /api/personas/:id
router.patch("/:id/status", EmotionController.toggleEmotionStatus); // patch /api/personas/:id

module.exports = router;
