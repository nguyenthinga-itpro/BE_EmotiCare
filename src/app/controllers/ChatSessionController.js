const { adminDB } = require("../../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");
const ChatSession = require("../models/ChatSession");

const chatSessionsCollection = adminDB.collection("chatSessions");

const ChatSessionController = {
  // === GET ALL CHAT SESSIONS (pagination) ===
  getAll: async (req, res) => {
    try {
      let { pageSize = 10, sort = "desc", startAfterId } = req.query;
      pageSize = parseInt(pageSize);

      let queryRef = chatSessionsCollection;
      let countQueryRef = chatSessionsCollection;

      const snapshotCount = await countQueryRef.count().get();
      const total = snapshotCount.data().count;

      queryRef = queryRef.orderBy("updatedAt", sort);
      if (startAfterId) {
        const startAfterDoc = await chatSessionsCollection
          .doc(startAfterId)
          .get();
        if (startAfterDoc.exists) queryRef = queryRef.startAfter(startAfterDoc);
      }
      queryRef = queryRef.limit(pageSize);

      const snapshot = await queryRef.get();
      const chatSessions = snapshot.docs.map((doc) =>
        ChatSession.fromFirestore(doc)
      );

      res.status(200).json({
        pageSize,
        total,
        chatSessions,
        sort: sort === "asc" ? "oldest" : "newest",
        nextCursor: chatSessions.length
          ? chatSessions[chatSessions.length - 1].id
          : null,
      });
    } catch (err) {
      console.error("Get all chat sessions error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === GET CHAT SESSION BY ID ===
  getById: async (req, res) => {
    try {
      const doc = await chatSessionsCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Chat session not found" });

      res.status(200).json(ChatSession.fromFirestore(doc));
    } catch (err) {
      console.error("Get chat session by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === CREATE CHAT SESSION ===
  create: async (req, res) => {
    try {
      const { userId, chatAIId, rating } = req.body;
      if (!userId || !chatAIId)
        return res
          .status(400)
          .json({ error: "userId and chatAIId are required" });

      const now = Timestamp.now();
      const newDoc = chatSessionsCollection.doc();

      await newDoc.set({
        userId,
        chatAIId,
        rating: rating || null,
        isDisabled: false,
        createdAt: now,
        updatedAt: now,
      });

      const doc = await newDoc.get();
      res.status(201).json({
        message: "Chat session created",
        chatSession: ChatSession.fromFirestore(doc),
      });
    } catch (err) {
      console.error("Create chat session error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === UPDATE CHAT SESSION ===
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: Timestamp.now() };

      const docRef = chatSessionsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Chat session not found" });

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Chat session updated",
        chatSession: ChatSession.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update chat session error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === TOGGLE CHAT SESSION STATUS ===
  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isDisabled } = req.body;

      if (typeof isDisabled !== "boolean")
        return res.status(400).json({ error: "isDisabled must be boolean" });

      const docRef = chatSessionsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Chat session not found" });

      await docRef.update({ isDisabled, updatedAt: Timestamp.now() });
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: isDisabled
          ? "Chat session disabled successfully"
          : "Chat session enabled successfully",
        chatSession: ChatSession.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Toggle chat session status error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ChatSessionController;
