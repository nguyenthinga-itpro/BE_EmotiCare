// src/routes/ai.js
const express = require("express");
const router = express.Router();
const ResourceController = require("../app/controllers/ResourceController");

// CRUD + pagination
router.get("/", ResourceController.getAll); // GET /api/personas?page=1&limit=10
router.get("/:id", ResourceController.getById); // GET /api/personas/:id
router.post("/", ResourceController.create); // POST /api/personas
router.patch("/:id", ResourceController.update); // patch /api/personas/:id
router.delete("/:id", ResourceController.delete); // DELETE /api/personas/:id

module.exports = router;
