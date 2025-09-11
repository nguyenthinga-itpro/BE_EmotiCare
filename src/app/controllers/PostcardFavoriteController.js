const { adminDB } = require("../../config/firebase");
const PostcardFavorite = require("../models/PostcardFavorite");

const favoritesCollection = adminDB.collection("postcardFavorites");

const PostcardFavoriteController = {
  // GET all favorites with pagination
  getAll: async (req, res) => {
    try {
      let { page = 1, pageSize = 10 } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      const snapshot = await favoritesCollection
        .orderBy("createdAt", "desc")
        .get();

      const allFavorites = snapshot.docs.map((doc) =>
        PostcardFavorite.fromFirestore(doc)
      );

      const startIndex = (page - 1) * pageSize;
      const pagedFavorites = allFavorites.slice(
        startIndex,
        startIndex + pageSize
      );

      res.status(200).json({
        page,
        pageSize,
        total: allFavorites.length,
        favorites: pagedFavorites,
      });
    } catch (err) {
      console.error("Get all postcard favorites error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET single favorite by ID
  getById: async (req, res) => {
    try {
      const doc = await favoritesCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Favorite not found" });

      res.status(200).json(PostcardFavorite.fromFirestore(doc));
    } catch (err) {
      console.error("Get postcard favorite by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // CREATE new favorite
  create: async (req, res) => {
    try {
      const { postcardId, userId, quantity = 1 } = req.body;
      if (!postcardId || !userId)
        return res
          .status(400)
          .json({ error: "postcardId and userId required" });

      const now = new Date().toISOString();
      const newDoc = favoritesCollection.doc();
      await newDoc.set({
        postcardId,
        userId,
        quantity,
        createdAt: now,
      });

      const doc = await newDoc.get();
      res.status(201).json({
        message: "Favorite created successfully",
        favorite: PostcardFavorite.fromFirestore(doc),
      });
    } catch (err) {
      console.error("Create postcard favorite error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // UPDATE favorite by ID
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const docRef = favoritesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Favorite not found" });

      await docRef.update({ ...updates, updatedAt: new Date().toISOString() });
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Favorite updated successfully",
        favorite: PostcardFavorite.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update postcard favorite error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE favorite by ID (optional soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = favoritesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Favorite not found" });

      await docRef.delete();

      res.status(200).json({ message: "Favorite deleted successfully" });
    } catch (err) {
      console.error("Delete postcard favorite error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = PostcardFavoriteController;
