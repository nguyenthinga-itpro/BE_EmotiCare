const { adminDB } = require("../../config/firebase");
const ConversationHistory = require("../models/ConversationHistory");

const conversationCollection = adminDB.collection("conversationHistories");

const ConversationHistoryController = {
  // GET all conversation histories (with pagination)
  getAll: async (req, res) => {
    try {
      let { page = 1, pageSize = 10 } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      const snapshot = await conversationCollection
        .orderBy("createdAt", "desc")
        .get();

      const allConversations = snapshot.docs.map((doc) =>
        ConversationHistory.fromFirestore(doc)
      );

      const startIndex = (page - 1) * pageSize;
      const pagedConversations = allConversations.slice(
        startIndex,
        startIndex + pageSize
      );

      res.status(200).json({
        page,
        pageSize,
        total: allConversations.length,
        conversationHistories: pagedConversations,
      });
    } catch (err) {
      console.error("Get all conversation histories error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET single conversation history by ID
  getById: async (req, res) => {
    try {
      const doc = await conversationCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res
          .status(404)
          .json({ error: "Conversation history not found" });

      res.status(200).json(ConversationHistory.fromFirestore(doc));
    } catch (err) {
      console.error("Get conversation history by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // CREATE new conversation history
  create: async (req, res) => {
    try {
      const { sessionId, messageType, sender, message } = req.body;
      if (!sessionId || !messageType || !sender || !message)
        return res.status(400).json({ error: "Missing required fields" });

      const now = new Date().toISOString();
      const newDoc = conversationCollection.doc();
      await newDoc.set({
        sessionId,
        messageType,
        sender,
        message,
        createdAt: now,
      });

      const doc = await newDoc.get();
      res.status(201).json({
        message: "Conversation history created",
        conversation: ConversationHistory.fromFirestore(doc),
      });
    } catch (err) {
      console.error("Create conversation history error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // UPDATE conversation history by ID
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      updates.updatedAt = new Date().toISOString();

      const docRef = conversationCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res
          .status(404)
          .json({ error: "Conversation history not found" });

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Conversation history updated",
        conversation: ConversationHistory.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update conversation history error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE conversation history (soft delete: set isDisabled = true, optional)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = conversationCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res
          .status(404)
          .json({ error: "Conversation history not found" });

      await docRef.update({
        isDisabled: true,
        updatedAt: new Date().toISOString(),
      });
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Conversation history disabled successfully",
        conversation: ConversationHistory.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Delete conversation history error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ConversationHistoryController;
