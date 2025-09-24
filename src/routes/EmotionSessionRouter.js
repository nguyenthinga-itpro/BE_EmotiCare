const express = require("express");
const router = express.Router();
const EmotionSessionController = require("../app/controllers/EmotionSessionController");

router.get("/", EmotionSessionController.getAll);
router.get("/:id", EmotionSessionController.getById);
router.post("/", EmotionSessionController.create);
router.put("/:id", EmotionSessionController.update);
router.patch("/:id/status", EmotionSessionController.toggleStatus);

module.exports = router;
