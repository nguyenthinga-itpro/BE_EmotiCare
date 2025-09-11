// src/routes/ai.js
const express = require("express");
const router = express.Router();
const PostcardController = require("../app/controllers/PostcardController");

// CRUD + pagination
router.get("/", PostcardController.getAll); // GET /api/personas?page=1&limit=10
router.get("/:id", PostcardController.getById); // GET /api/personas/:id
router.post("/", PostcardController.create); // POST /api/personas
router.patch("/:id", PostcardController.update); // patch /api/personas/:id
router.delete("/:id", PostcardController.delete); // DELETE /api/personas/:id

module.exports = router;
