const { Timestamp } = require("firebase-admin/firestore");
const { adminDB } = require("../../config/firebase");
const Postcard = require("../models/Postcard");
const { getTrack } = require("../services/SpotifyService");
const postcardsCollection = adminDB.collection("postcards");

const PostcardController = {
  getAll: async (req, res) => {
    try {
      let { page = 1, pageSize = 10 } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      const snapshot = await postcardsCollection
        .orderBy("updatedAt", "desc")
        .get();
      const allPostcards = snapshot.docs
        .map((doc) => Postcard.fromFirestore(doc))
        .filter((p) => !p.isDisabled);

      const startIndex = (page - 1) * pageSize;
      const pagedPostcards = allPostcards.slice(
        startIndex,
        startIndex + pageSize
      );

      res.status(200).json({
        page,
        pageSize,
        total: allPostcards.length,
        postcards: pagedPostcards,
      });
    } catch (err) {
      console.error("Get all postcards error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
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

  create: async (req, res) => {
    try {
      const { title, description, image, category, music } = req.body;

      let musicData = null;
      if (music) {
        try {
          musicData = await getTrack(music); // hoặc trackId
        } catch (err) {
          console.warn("Spotify track fetch failed, lưu link gốc", err);
          musicData = music; // fallback lưu link gốc
        }
      }

      const newDoc = postcardsCollection.doc();

      await newDoc.set({
        title,
        description: description || "",
        image,
        category: category || "",
        music: musicData || music || "",
        isDisabled: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const doc = await newDoc.get();
      res.status(201).json({
        message: "Postcard created",
        postcard: Postcard.fromFirestore(doc),
      });
    } catch (err) {
      console.error("Create postcard error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      updates.updatedAt = new Date().toISOString();

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

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = postcardsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Postcard not found" });

      await docRef.update({
        isDisabled: true,
        updatedAt: new Date().toISOString(),
      });

      const updatedDoc = await docRef.get();
      res.status(200).json({
        message: "Postcard disabled successfully",
        postcard: Postcard.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Delete postcard error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = PostcardController;
