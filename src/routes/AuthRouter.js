const express = require("express");
const AuthController = require("../app/controllers/AuthController");
const router = express.Router();
const {
  verifyToken,
  checkEmailStatus,
} = require("../app/middlewares/AuthMiddleware");

router.post("/register", checkEmailStatus, AuthController.register);
router.post("/verify", AuthController.verifyEmail);
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/logout", verifyToken, AuthController.logout);

module.exports = router;
