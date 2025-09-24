// src/routes/ai.js
const express = require("express");
const router = express.Router();
const FAQController = require("../app/controllers/FAQController");

// CRUD + pagination
router.get("/", FAQController.getAllFaqs); // GET /api/personas?page=1&limit=10
router.get("/:id", FAQController.getFaqById); // GET /api/personas/:id
router.post("/", FAQController.createFaq); // POST /api/personas
router.patch("/:id", FAQController.updateFaq); // patch /api/personas/:id
router.patch("/:id/status", FAQController.toggleFaqStatus); // patch /api/personas/:id

module.exports = router;
