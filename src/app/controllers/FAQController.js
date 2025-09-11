// controllers/FAQController.js
const { adminDB } = require("../../config/firebase");
const FAQ = require("../models/FAQ");

const faqsCollection = adminDB.collection("faqs");

const FAQController = {
  getAll: async (req, res) => {
    try {
      let { page = 1, pageSize = 10 } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      const snapshot = await faqsCollection.orderBy("updatedAt", "desc").get();
      const allFaqs = snapshot.docs
        .map((doc) => FAQ.fromFirestore(doc))
        .filter((faq) => !faq.isDisabled);

      const startIndex = (page - 1) * pageSize;
      const pagedFaqs = allFaqs.slice(startIndex, startIndex + pageSize);

      res.status(200).json({
        page,
        pageSize,
        total: allFaqs.length,
        faqs: pagedFaqs,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const doc = await faqsCollection.doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "FAQ not found" });
      res.status(200).json(FAQ.fromFirestore(doc));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { question, answer } = req.body;
      if (!question || !answer)
        return res.status(400).json({ error: "Question and Answer required" });

      const newDoc = await faqsCollection.add({
        question,
        answer,
        isDisabled: false,
        updatedAt: new Date(),
      });
      const doc = await newDoc.get();
      res
        .status(201)
        .json({ message: "FAQ created", faq: FAQ.fromFirestore(doc) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { question, answer, isDisabled } = req.body;

      const docRef = faqsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "FAQ not found" });

      await docRef.update({
        question: question ?? doc.data().question,
        answer: answer ?? doc.data().answer,
        isDisabled: isDisabled ?? doc.data().isDisabled,
        updatedAt: new Date(),
      });

      const updatedDoc = await docRef.get();
      res
        .status(200)
        .json({ message: "FAQ updated", faq: FAQ.fromFirestore(updatedDoc) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const docRef = faqsCollection.doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "FAQ not found" });

      await docRef.update({ isDisabled: true, updatedAt: new Date() });
      const updatedDoc = await docRef.get();

      res
        .status(200)
        .json({
          message: "FAQ disabled successfully",
          faq: FAQ.fromFirestore(updatedDoc),
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = FAQController;
