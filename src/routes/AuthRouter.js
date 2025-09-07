const express = require("express");
const AuthController = require("../app/controllers/AuthController");
const AuthMiddleware = require("../app/middlewares/AuthMiddleware");

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// route test auth middleware
router.get("/profile", AuthMiddleware, (req, res) => {
  res.json({ message: "You are authenticated" });
});

module.exports = router;
