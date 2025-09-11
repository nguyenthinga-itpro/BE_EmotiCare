// src/routes/ai.js
const express = require("express");
const router = express.Router();
const PostcardShareController = require("../app/controllers/PostcardShareController");

// CRUD + pagination
router.get("/", PostcardShareController.getAll); // GET /api/personas?page=1&limit=10
router.get("/:id", PostcardShareController.getById); // GET /api/personas/:id
router.post("/", PostcardShareController.create); // POST /api/personas
router.delete("/:id", PostcardShareController.delete); // DELETE /api/personas/:id

module.exports = router;
