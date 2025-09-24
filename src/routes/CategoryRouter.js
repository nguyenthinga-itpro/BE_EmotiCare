// src/routes/ai.js
const express = require("express");
const router = express.Router();
const CategoryController = require("../app/controllers/CategoryController");

// CRUD + pagination
router.get("/", CategoryController.getAll); // GET /api/personas?page=1&limit=10
router.get("/:id", CategoryController.getById); // GET /api/personas/:id
router.post("/", CategoryController.create); // POST /api/personas
router.patch("/:id", CategoryController.update); // patch /api/personas/:id
router.patch("/:id/status", CategoryController.toggleStatus); // patch /api/personas/:id

module.exports = router;
