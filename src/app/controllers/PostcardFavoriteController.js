const { adminRTDB } = require("../../config/firebase");
const favoritesRef = adminRTDB.ref("postcardFavorites");

const PostcardFavoriteController = {
  // Get all postcards' favorite counts
  getAllFavorites: async (req, res) => {
    try {
      const snapshot = await favoritesRef.once("value");
      const allData = snapshot.val() || {}; // { postcardId1: {userId: true}, postcardId2: {...} }
      const result = {};

      Object.keys(allData).forEach((postcardId) => {
        result[postcardId] = Object.keys(allData[postcardId]).length;
      });

      res.status(200).json(result); // { postcardId1: 3, postcardId2: 5, ... }
    } catch (error) {
      console.error("Get all favorites error:", error);
      res.status(500).json({ error: error.message });
    }
  },
  // Toggle favorite (like / unlike)
  toggleFavorite: async (req, res) => {
    const { postcardId } = req.params;
    const { userId } = req.body;
    console.log(postcardId, userId);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      const userFavoriteRef = favoritesRef.child(`${postcardId}/${userId}`);
      const snapshot = await userFavoriteRef.once("value");

      if (snapshot.exists()) {
        await userFavoriteRef.remove();
        res.status(200).json({ message: "Unfavorited", isFavorite: false });
      } else {
        await userFavoriteRef.set(true);
        res.status(200).json({ message: "Favorited", isFavorite: true });
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get total favorites & check if user liked
  getFavoriteInfo: async (req, res) => {
    const { postcardId } = req.params;
    const { userId } = req.query; // Optional: check user

    try {
      const postcardFavorites = await favoritesRef
        .child(postcardId)
        .once("value");
      const data = postcardFavorites.val() || {};
      const totalFavorites = Object.keys(data).length;
      const isFavorite = userId ? !!data[userId] : false;

      res.status(200).json({ totalFavorites, isFavorite });
    } catch (error) {
      console.error("Get favorite info error:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = PostcardFavoriteController;
