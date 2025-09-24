// src/routes/ai.js
const express = require("express");
const router = express.Router();
const PostcardController = require("../app/controllers/PostcardController");

// CRUD + pagination
router.get("/", PostcardController.getAllPostcards); // GET /api/personas?page=1&limit=10
router.get("/:id", PostcardController.getPostcardById); // GET /api/personas/:id
router.post("/", PostcardController.createPostcard); // POST /api/personas
router.patch("/:id", PostcardController.updatePostcard); // patch /api/personas/:id
router.patch("/:id/status", PostcardController.togglePostcardStatus); // patch /api/personas/:id

module.exports = router;
