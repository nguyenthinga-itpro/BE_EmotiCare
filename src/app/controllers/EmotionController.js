// module.exports = EmotionController;
const { adminDB } = require("../../config/firebase");
const Emotion = require("../models/Emotion");
const { Timestamp } = require("firebase-admin/firestore");
const emotionsCollection = adminDB.collection("emotions");

const EmotionController = {
  // === GET ALL EMOTIONS (with pagination, filters) ===
  getAllEmotions: async (req, res) => {
    try {
      let { pageSize = 10, categoryId, sort = "desc", startAfterId } = req.query;
      pageSize = parseInt(pageSize);

      let queryRef = emotionsCollection;
      let countQueryRef = emotionsCollection;

      // --- filter categoryId ---
      if (categoryId) {
        queryRef = queryRef.where("categoryId", "==", categoryId);
        countQueryRef = countQueryRef.where("categoryId", "==", categoryId);
      }

      // --- total emotions ---
      const snapshotCount = await countQueryRef.count().get();
      const total = snapshotCount.data().count;

      // --- phân trang ---
      queryRef = queryRef.orderBy("createdAt", sort); // cần orderBy trước startAfter
      if (startAfterId) {
        const startAfterDoc = await emotionsCollection.doc(startAfterId).get();
        if (startAfterDoc.exists) queryRef = queryRef.startAfter(startAfterDoc);
      }
      queryRef = queryRef.limit(pageSize);

      // --- lấy emotions ---
      const snapshot = await queryRef.get();
      let emotions = snapshot.docs.map((doc) => Emotion.fromFirestore(doc));

      // --- trả về ---
      res.status(200).json({
        pageSize,
        total,
        emotions,
        sort: sort === "asc" ? "oldest" : "newest",
        nextCursor: emotions.length ? emotions[emotions.length - 1].id : null,
      });
    } catch (error) {
      console.error("Get all emotions error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // === GET EMOTION BY ID ===
  getEmotionById: async (req, res) => {
    try {
      const doc = await emotionsCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Emotion not found" });

      const emotion = Emotion.fromFirestore(doc);
      res.status(200).json(emotion);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  createEmotion: async (req, res) => {
    try {
      const { name, emoji, description, categoryId } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const newEmotion = {
        name,
        categoryId,
        emoji,
        description: description || "",
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await emotionsCollection.add(newEmotion);
      const createdDoc = await docRef.get();

      res.status(201).json({ id: docRef.id, ...createdDoc.data() });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  // === UPDATE EMOTION ===
  updateEmotion: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: Timestamp.now() };

      const docRef = emotionsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Emotion not found" });

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Emotion updated",
        emotion: Emotion.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update emotion error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === TOGGLE EMOTION STATUS ===
  toggleEmotionStatus: async (req, res) => {
    try {
      const emotionRef = emotionsCollection.doc(req.params.id);
      const doc = await emotionRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Emotion not found" });

      const { isDisabled } = req.body;
      if (typeof isDisabled !== "boolean")
        return res.status(400).json({ error: "isDisabled must be boolean" });

      await emotionRef.update({ isDisabled, updatedAt: new Date() });
      const updatedDoc = await emotionRef.get();

      res.status(200).json({
        message: isDisabled
          ? "Emotion disabled successfully"
          : "Emotion enabled successfully",
        emotion: Emotion.fromFirestore(updatedDoc),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = EmotionController;
