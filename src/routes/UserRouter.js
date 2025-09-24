// src/routes/ai.js
const express = require("express");
const router = express.Router();
const UserController = require("../app/controllers/UserController");

// CRUD + pagination
router.get("/statistic", UserController.getDashboardStats);
router.get("/statsByPeriod", UserController.statsByPeriod);
router.get("/", UserController.getAllUsers); // GET /user?page=1&pageSize=10
router.get("/:id", UserController.getUserById); // GET /user/:id
router.patch("/:id", UserController.updateUser); // UPDATE user
router.patch("/:id/email", UserController.updateEmail); // UPDATE user
router.patch("/:id/status", UserController.toggleUserStatus); // patch user (set isDisabled)
module.exports = router;
