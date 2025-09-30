// module.exports = ChatAIController;
const { adminDB } = require("../../config/firebase");
const openai = require("../../config/openai");
const { Timestamp, FieldValue } = require("firebase-admin/firestore");
const ChatAI = require("../models/ChatAI");
const chatAIsCollection = adminDB.collection("chatAIs");

const ChatAIController = {
  // === GET ALL CHAT AIs (pagination) ===
  getAllChats: async (req, res) => {
    try {
      let { pageSize = 10, sort = "desc", startAfterId } = req.query;
      pageSize = parseInt(pageSize);

      let queryRef = chatAIsCollection;
      queryRef = queryRef.orderBy("createdAt", sort);

      if (startAfterId) {
        const startAfterDoc = await chatAIsCollection.doc(startAfterId).get();
        if (startAfterDoc.exists) queryRef = queryRef.startAfter(startAfterDoc);
      }

      queryRef = queryRef.limit(pageSize);
      const snapshot = await queryRef.get();

      const chats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const totalSnapshot = await chatAIsCollection.count().get();
      const total = totalSnapshot.data().count;

      res.status(200).json({
        pageSize,
        total,
        sort: sort === "asc" ? "oldest" : "newest",
        chats,
        nextCursor: chats.length ? chats[chats.length - 1].id : null,
      });
    } catch (err) {
      console.error("Get all chats error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === GET CHAT BY ID ===
  getChatById: async (req, res) => {
    try {
      const doc = await chatAIsCollection.doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "Chat not found" });

      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (err) {
      console.error("Get chat by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === CREATE CHAT ===
  createChat: async (req, res) => {
    try {
      const {
        name,
        systemPrompt,
        description,
        defaultGreeting,
        image,
        categoryId,
      } = req.body;
      if (!name || !systemPrompt)
        return res
          .status(400)
          .json({ error: "Name and systemPrompt are required" });

      const now = Timestamp.now();
      const docRef = await chatAIsCollection.add({
        name,
        systemPrompt,
        description: description || "",
        defaultGreeting: defaultGreeting || "",
        image: image || "",
        isDisabled: false,
        createdAt: now,
        updatedAt: now,
        categoryId,
      });

      const createdDoc = await docRef.get();
      res.status(201).json({
        message: "Chat created successfully",
        chat: { id: docRef.id, ...createdDoc.data() },
      });
    } catch (err) {
      console.error("Create chat error:", err);
      res.status(500).json({ error: err.message });
    }
  },
  // === UPDATE Chat ===
  updateChat: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: Timestamp.now() };

      const docRef = chatAIsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Chat not found" });

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Chat updated successfully",
        chat: ChatAI.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update chat error:", err);
      res.status(500).json({ error: err.message });
    }
  },
  // === TOGGLE CHAT STATUS ===
  toggleChatStatus: async (req, res) => {
    try {
      const docRef = chatAIsCollection.doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Chat not found" });

      const { isDisabled } = req.body;
      if (typeof isDisabled !== "boolean")
        return res.status(400).json({ error: "isDisabled must be boolean" });

      await docRef.update({ isDisabled, updatedAt: Timestamp.now() });
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: isDisabled
          ? "Chat disabled successfully"
          : "Chat enabled successfully",
        chat: { id: updatedDoc.id, ...updatedDoc.data() },
      });
    } catch (err) {
      console.error("Toggle chat status error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === SEND MESSAGE TO CHAT ===
  sendMessage: async (req, res) => {
    try {
      const { personaId } = req.params;
      const { userId, message } = req.body;
      if (!message)
        return res.status(400).json({ error: "Message is required" });

      const personaDoc = await chatAIsCollection.doc(personaId).get();
      if (!personaDoc.exists)
        return res.status(404).json({ error: "Chat not found" });
      const personaData = personaDoc.data();

      const messagesRef = chatAIsCollection
        .doc(personaId)
        .collection("messages");

      // Save user message
      await messagesRef.add({
        senderId: userId || "anonymous",
        text: message,
        type: "user",
        createdAt: FieldValue.serverTimestamp(),
      });

      // AI reply
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: personaData.systemPrompt },
          { role: "user", content: message },
        ],
      });

      const aiReply = completion.choices[0].message.content;

      await messagesRef.add({
        senderId: "ai",
        text: aiReply,
        type: "ai",
        createdAt: FieldValue.serverTimestamp(),
      });

      res.status(200).json({ reply: aiReply });
    } catch (err) {
      console.error("Send message error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ChatAIController;
