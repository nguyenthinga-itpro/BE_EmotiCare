const { adminDB } = require("../../config/firebase");
const ChatSession = require("../models/ChatSession");

const chatSessionsCollection = adminDB.collection("chatSessions");

const ChatSessionController = {
  // GET all chat sessions với phân trang
  getAll: async (req, res) => {
    try {
      let { page = 1, pageSize = 10 } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      const snapshot = await chatSessionsCollection
        .orderBy("updatedAt", "desc")
        .get();
      const allSessions = snapshot.docs.map((doc) =>
        ChatSession.fromFirestore(doc)
      );

      const startIndex = (page - 1) * pageSize;
      const pagedSessions = allSessions.slice(
        startIndex,
        startIndex + pageSize
      );

      res.status(200).json({
        page,
        pageSize,
        total: allSessions.length,
        chatSessions: pagedSessions,
      });
    } catch (err) {
      console.error("Get all chat sessions error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET single chat session by ID
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

  // CREATE new chat session
  create: async (req, res) => {
    try {
      const { userId, chatAIId, rating } = req.body;
      if (!userId || !chatAIId)
        return res
          .status(400)
          .json({ error: "userId and chatAIId are required" });

      const now = new Date().toISOString();
      const newDoc = chatSessionsCollection.doc();

      await newDoc.set({
        userId,
        chatAIId,
        rating: rating || null,
        createdAt: now,
        updatedAt: now,
      });

      const doc = await newDoc.get();
      res
        .status(201)
        .json({
          message: "Chat session created",
          chatSession: ChatSession.fromFirestore(doc),
        });
    } catch (err) {
      console.error("Create chat session error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // UPDATE chat session by ID
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      updates.updatedAt = new Date().toISOString();

      const docRef = chatSessionsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Chat session not found" });

      await docRef.update(updates);

      const updatedDoc = await docRef.get();
      res
        .status(200)
        .json({
          message: "Chat session updated",
          chatSession: ChatSession.fromFirestore(updatedDoc),
        });
    } catch (err) {
      console.error("Update chat session error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE chat session = set isDisabled: true (optional)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = chatSessionsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Chat session not found" });

      // Nếu muốn chỉ “disable” thay vì xóa:
      await docRef.update({
        isDisabled: true,
        updatedAt: new Date().toISOString(),
      });

      const updatedDoc = await docRef.get();
      res
        .status(200)
        .json({
          message: "Chat session disabled successfully",
          chatSession: ChatSession.fromFirestore(updatedDoc),
        });
    } catch (err) {
      console.error("Delete chat session error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ChatSessionController;
