// src/routes/ai.js
const express = require("express");
const router = express.Router();
const ResourceController = require("../app/controllers/ResourceController");

// CRUD + pagination
router.get("/", ResourceController.getAllResources); // GET /api/personas?page=1&limit=10
router.get("/:id", ResourceController.getResourceById); // GET /api/personas/:id
router.post("/", ResourceController.createResource); // POST /api/personas
router.patch("/:id", ResourceController.updateResource); // patch /api/personas/:id
router.patch("/:id/status", ResourceController.toggleResourceStatus); // patch /api/personas/:id

module.exports = router;
