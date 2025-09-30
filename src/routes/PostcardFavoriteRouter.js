const express = require("express");
const router = express.Router();
const PostcardFavoriteController = require("../app/controllers/PostcardFavoriteController");
router.get("/", PostcardFavoriteController.getAllFavorites);
// Like / Unlike
router.post("/:postcardId/favorite", PostcardFavoriteController.toggleFavorite);

// Get favorite info
router.get("/:postcardId/favorite", PostcardFavoriteController.getFavoriteInfo);

module.exports = router;
