const { adminDB } = require("../../config/firebase");
const Emotion = require("../models/Emotion");

const emotionsCollection = adminDB.collection("emotions");

const EmotionController = {
  // GET all emotions với phân trang
  getAll: async (req, res) => {
    try {
      let { page = 1, pageSize = 10 } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      const snapshot = await emotionsCollection
        .orderBy("updatedAt", "desc")
        .get();
      const allEmotions = snapshot.docs
        .map((doc) => Emotion.fromFirestore(doc))
        .filter((e) => !e.isDisabled);

      const startIndex = (page - 1) * pageSize;
      const pagedEmotions = allEmotions.slice(
        startIndex,
        startIndex + pageSize
      );

      res.status(200).json({
        page,
        pageSize,
        total: allEmotions.length,
        emotions: pagedEmotions,
      });
    } catch (err) {
      console.error("Get all emotions error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET single emotion by ID
  getById: async (req, res) => {
    try {
      const doc = await emotionsCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Emotion not found" });
      res.status(200).json(Emotion.fromFirestore(doc));
    } catch (err) {
      console.error("Get emotion by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // CREATE new emotion
  create: async (req, res) => {
    try {
      const { name, category, emoji, description } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });

      const now = new Date().toISOString();
      const newDoc = emotionsCollection.doc();

      await newDoc.set({
        name,
        category: category || "",
        emoji: emoji || "",
        description: description || "",
        isDisabled: false,
        createdAt: now,
        updatedAt: now,
      });

      const doc = await newDoc.get();
      res
        .status(201)
        .json({
          message: "Emotion created",
          emotion: Emotion.fromFirestore(doc),
        });
    } catch (err) {
      console.error("Create emotion error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // UPDATE emotion by ID
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      updates.updatedAt = new Date().toISOString();

      const docRef = emotionsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Emotion not found" });

      await docRef.update(updates);

      const updatedDoc = await docRef.get();
      res
        .status(200)
        .json({
          message: "Emotion updated",
          emotion: Emotion.fromFirestore(updatedDoc),
        });
    } catch (err) {
      console.error("Update emotion error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE emotion = set isDisabled: true
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = emotionsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Emotion not found" });

      await docRef.update({
        isDisabled: true,
        updatedAt: new Date().toISOString(),
      });

      const updatedDoc = await docRef.get();
      res
        .status(200)
        .json({
          message: "Emotion disabled successfully",
          emotion: Emotion.fromFirestore(updatedDoc),
        });
    } catch (err) {
      console.error("Delete emotion error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = EmotionController;
