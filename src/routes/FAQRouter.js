// src/routes/ai.js
const express = require("express");
const router = express.Router();
const FAQController = require("../app/controllers/FAQController");

// CRUD + pagination
router.get("/", FAQController.getAll); // GET /api/personas?page=1&limit=10
router.get("/:id", FAQController.getById); // GET /api/personas/:id
router.post("/", FAQController.create); // POST /api/personas
router.patch("/:id", FAQController.update); // patch /api/personas/:id
router.delete("/:id", FAQController.delete); // DELETE /api/personas/:id

module.exports = router;
