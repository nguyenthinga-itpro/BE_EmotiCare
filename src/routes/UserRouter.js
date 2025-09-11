// src/routes/ai.js
const express = require("express");
const router = express.Router();
const UserController = require("../app/controllers/UserController");

// CRUD + pagination
router.get("/", UserController.getAllUsers); // GET /user?page=1&pageSize=10
router.get("/:id", UserController.getUserById); // GET /user/:id
router.patch("/:id", UserController.updateUser); // UPDATE user
router.delete("/:id", UserController.deleteUser); // DELETE user (set isDisabled)

module.exports = router;
