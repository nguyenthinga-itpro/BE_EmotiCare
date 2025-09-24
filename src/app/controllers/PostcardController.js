// module.exports = PostcardController;
const { adminDB } = require("../../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");
const Postcard = require("../models/Postcard");
const { getSpotifyData } = require("../services/SpotifyService");

const postcardsCollection = adminDB.collection("postcards");

const PostcardController = {
  // === GET ALL POSTCARDS (with pagination, filters) ===
  getAllPostcards: async (req, res) => {
    try {
      let { pageSize = 10, sort = "desc", startAfterId } = req.query;
      pageSize = parseInt(pageSize);

      let queryRef = postcardsCollection;
      let countQueryRef = postcardsCollection;

      const snapshotCount = await countQueryRef.count().get();
      const total = snapshotCount.data().count;

      queryRef = queryRef.orderBy("updatedAt", sort);
      if (startAfterId) {
        const startAfterDoc = await postcardsCollection.doc(startAfterId).get();
        if (startAfterDoc.exists) queryRef = queryRef.startAfter(startAfterDoc);
      }
      queryRef = queryRef.limit(pageSize);

      const snapshot = await queryRef.get();
      const postcards = snapshot.docs.map((doc) => Postcard.fromFirestore(doc));

      res.status(200).json({
        pageSize,
        total,
        postcards,
        sort: sort === "asc" ? "oldest" : "newest",
        nextCursor: postcards.length
          ? postcards[postcards.length - 1].id
          : null,
      });
    } catch (err) {
      console.error("Get all postcards error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === GET POSTCARD BY ID ===
  getPostcardById: async (req, res) => {
    try {
      const doc = await postcardsCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Postcard not found" });

      res.status(200).json(Postcard.fromFirestore(doc));
    } catch (err) {
      console.error("Get postcard by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === CREATE POSTCARD ===
  createPostcard: async (req, res) => {
    try {
      const { title, description, image, categoryId, music } = req.body;
      console.log(
        "title, description, image, category, music ",
        title,
        description,
        image,
        categoryId,
        music
      );
      if (!image) {
        return res
          .status(400)
          .json({ error: "Image URL is required. Upload file first." });
      }

      let musicData = null;
      if (music) {
        musicData = await getSpotifyData(music);
      }

      const newPostcard = {
        title,
        description: description || "",
        image,
        categoryId: categoryId || "",
        music: musicData,
        isDisabled: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await postcardsCollection.add(newPostcard);
      const createdDoc = await docRef.get();

      res.status(201).json({
        message: "Postcard created",
        postcard: Postcard.fromFirestore(createdDoc),
      });
    } catch (err) {
      console.error("Create postcard error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === UPDATE POSTCARD ===
  updatePostcard: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: Timestamp.now() };

      const docRef = postcardsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Postcard not found" });

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Postcard updated",
        postcard: Postcard.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update postcard error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === TOGGLE POSTCARD STATUS ===
  togglePostcardStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isDisabled } = req.body;

      if (typeof isDisabled !== "boolean")
        return res.status(400).json({ error: "isDisabled must be boolean" });

      const docRef = postcardsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Postcard not found" });

      await docRef.update({ isDisabled, updatedAt: Timestamp.now() });
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: isDisabled
          ? "Postcard disabled successfully"
          : "Postcard enabled successfully",
        postcard: Postcard.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Toggle postcard status error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = PostcardController;
