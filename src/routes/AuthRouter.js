const express = require("express");
const AuthController = require("../app/controllers/AuthController");
const { verifyToken } = require("../app/middlewares/AuthMiddleware");
const router = express.Router();

router.post("/register", AuthController.register);
router.post("/verify", AuthController.verifyEmail);
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/otp", AuthController.verifyOTP);
router.post("/forgotpassword", AuthController.forgotPassword);
router.post("/resetpassword", AuthController.resetPassword);
router.get("/me", verifyToken, AuthController.me);
router.post("/logout", verifyToken, AuthController.logout);
router.get("/refresh", AuthController.refreshToken);

module.exports = router;
