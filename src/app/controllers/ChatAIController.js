// controllers/ChatAIController.js
const { adminDB } = require("../../config/firebase");
const openai = require("../../config/openai");

const chatAIsCollection = adminDB.collection("chatAIs");

const ChatAIController = {
  list: async (req, res) => {
    try {
      let { page = 1, limit = 10 } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);

      const snapshot = await chatAIsCollection
        .orderBy("createdAt", "desc")
        .get();
      const total = snapshot.size;

      const docs = snapshot.docs.slice((page - 1) * limit, page * limit);
      const personas = docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      res.status(200).json({ page, limit, total, personas });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  get: async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await chatAIsCollection.doc(id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Persona not found" });
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const {
        name,
        systemPrompt,
        description,
        defaultGreeting,
        image,
        isDisabled = false,
        userId = null,
      } = req.body;
      if (!name || !systemPrompt)
        return res
          .status(400)
          .json({ error: "name and systemPrompt are required" });

      const now = new Date();
      const newDoc = await chatAIsCollection.add({
        name,
        systemPrompt,
        description: description || "",
        defaultGreeting: defaultGreeting || "",
        image: image || "",
        isDisabled,
        userId,
        createdAt: now,
        updatedAt: now,
      });

      res
        .status(201)
        .json({ message: "Persona created successfully", id: newDoc.id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: new Date() };

      await chatAIsCollection.doc(id).update(updates);
      res.status(200).json({ message: "Persona updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await chatAIsCollection
        .doc(id)
        .update({ isDisabled: true, updatedAt: new Date() });
      const updatedDoc = await chatAIsCollection.doc(id).get();

      res
        .status(200)
        .json({
          message: "Persona disabled successfully",
          persona: updatedDoc.data(),
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  chat: async (req, res) => {
    try {
      const { message, name } = req.body;
      if (!message)
        return res.status(400).json({ error: "Message is required" });

      const querySnap = await chatAIsCollection
        .where("name", "==", name)
        .limit(1)
        .get();
      if (querySnap.empty)
        return res.status(404).json({ error: `Persona "${name}" not found` });

      const personaData = querySnap.docs[0].data();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: personaData.systemPrompt },
          { role: "user", content: message },
        ],
      });

      res
        .status(200)
        .json({
          reply: completion.choices[0].message.content,
          persona: personaData.name,
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = ChatAIController;
