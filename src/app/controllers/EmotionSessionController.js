const { adminDB } = require("../../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");
const EmotionSession = require("../models/EmotionSession");

const emotionSessionsCollection = adminDB.collection("emotionSessions");

const EmotionSessionController = {
  // === GET ALL EMOTION SESSIONS (pagination) ===
  getAll: async (req, res) => {
    try {
      let { pageSize = 10, sort = "desc", startAfterId } = req.query;
      pageSize = parseInt(pageSize);

      let queryRef = emotionSessionsCollection;
      let countQueryRef = emotionSessionsCollection;

      const snapshotCount = await countQueryRef.count().get();
      const total = snapshotCount.data().count;

      queryRef = queryRef.orderBy("updatedAt", sort);
      if (startAfterId) {
        const startAfterDoc = await emotionSessionsCollection
          .doc(startAfterId)
          .get();
        if (startAfterDoc.exists) queryRef = queryRef.startAfter(startAfterDoc);
      }
      queryRef = queryRef.limit(pageSize);

      const snapshot = await queryRef.get();
      const emotionSessions = snapshot.docs.map((doc) =>
        EmotionSession.fromFirestore(doc)
      );

      res.status(200).json({
        pageSize,
        total,
        emotionSessions,
        sort: sort === "asc" ? "oldest" : "newest",
        nextCursor: emotionSessions.length
          ? emotionSessions[emotionSessions.length - 1].id
          : null,
      });
    } catch (err) {
      console.error("Get all emotion sessions error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === GET EMOTION SESSION BY ID ===
  getById: async (req, res) => {
    try {
      const doc = await emotionSessionsCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Emotion session not found" });

      res.status(200).json(EmotionSession.fromFirestore(doc));
    } catch (err) {
      console.error("Get emotion session by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === CREATE EMOTION SESSION ===
  create: async (req, res) => {
    try {
      const { userId, emotionId, intensity } = req.body;
      if (!userId || emotionId == null)
        return res
          .status(400)
          .json({ error: "userId and emotionId are required" });

      const now = Timestamp.now();
      const newDoc = emotionSessionsCollection.doc();

      await newDoc.set({
        userId,
        emotionId,
        intensity: intensity || "",
        isDisabled: false,
        createdAt: now,
        updatedAt: now,
      });

      const doc = await newDoc.get();
      res.status(201).json({
        message: "Emotion session created",
        emotionSession: EmotionSession.fromFirestore(doc),
      });
    } catch (err) {
      console.error("Create emotion session error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === UPDATE EMOTION SESSION ===
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: Timestamp.now() };

      const docRef = emotionSessionsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Emotion session not found" });

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Emotion session updated",
        emotionSession: EmotionSession.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update emotion session error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === TOGGLE EMOTION SESSION STATUS ===
  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isDisabled } = req.body;

      if (typeof isDisabled !== "boolean")
        return res.status(400).json({ error: "isDisabled must be boolean" });

      const docRef = emotionSessionsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Emotion session not found" });

      await docRef.update({ isDisabled, updatedAt: Timestamp.now() });
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: isDisabled
          ? "Emotion session disabled successfully"
          : "Emotion session enabled successfully",
        emotionSession: EmotionSession.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Toggle emotion session status error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = EmotionSessionController;
