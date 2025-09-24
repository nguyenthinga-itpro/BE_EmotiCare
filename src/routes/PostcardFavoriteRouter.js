// src/routes/ai.js
const express = require("express");
const router = express.Router();
const PostcardFavoriteController = require("../app/controllers/PostcardFavoriteController");
const { verifyToken, isAdmin } = require("../app/middlewares/AuthMiddleware");
// CRUD + pagination
router.get("/", PostcardFavoriteController.getAll); // GET /api/personas?page=1&limit=10
router.get("/:id", verifyToken, isAdmin, PostcardFavoriteController.getById); // GET /api/personas/:id
router.post("/", PostcardFavoriteController.create); // POST /api/personas
router.patch("/:id", verifyToken, isAdmin, PostcardFavoriteController.update); // patch /api/personas/:id
router.patch("/:id", verifyToken, isAdmin, PostcardFavoriteController.delete); // patch /api/personas/:id

module.exports = router;
