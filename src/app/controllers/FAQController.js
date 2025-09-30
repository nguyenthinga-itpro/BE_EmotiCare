// controllers/FAQController.js
const { adminDB } = require("../../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");
const FAQ = require("../models/FAQ");

const faqsCollection = adminDB.collection("faqs");

const FAQController = {
  // === GET ALL FAQS (pagination + sort) ===
  getAllFaqs: async (req, res) => {
    try {
      let { pageSize = 10, sort = "desc", startAfterId } = req.query;
      pageSize = parseInt(pageSize);

      let queryRef = faqsCollection;
      let countQueryRef = faqsCollection;

      // count documents
      const snapshotCount = await countQueryRef.count().get();
      const total = snapshotCount.data().count;

      queryRef = queryRef.orderBy("updatedAt", sort);
      if (startAfterId) {
        const startAfterDoc = await faqsCollection.doc(startAfterId).get();
        if (startAfterDoc.exists) {
          queryRef = queryRef.startAfter(startAfterDoc);
        }
      }
      queryRef = queryRef.limit(pageSize);

      const snapshot = await queryRef.get();
      const faqs = snapshot.docs.map((doc) => FAQ.fromFirestore(doc));

      res.status(200).json({
        pageSize,
        total,
        faqs,
        sort: sort === "asc" ? "oldest" : "newest",
        nextCursor: faqs.length ? faqs[faqs.length - 1].id : null,
      });
    } catch (err) {
      console.error("Get all FAQs error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === GET FAQ BY ID ===
  getFaqById: async (req, res) => {
    try {
      const doc = await faqsCollection.doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "FAQ not found" });

      res.status(200).json(FAQ.fromFirestore(doc));
    } catch (err) {
      console.error("Get FAQ by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === CREATE FAQ ===
  createFaq: async (req, res) => {
    try {
      const { question, answer, category } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ error: "Question and Answer required" });
      }

      const newFaq = {
        question,
        answer,
        category,
        isDisabled: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await faqsCollection.add(newFaq);
      const createdDoc = await docRef.get();

      res.status(201).json({
        message: "FAQ created",
        faq: FAQ.fromFirestore(createdDoc),
      });
    } catch (err) {
      console.error("Create FAQ error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === UPDATE FAQ ===
  updateFaq: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: Timestamp.now() };

      const docRef = faqsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "FAQ not found" });

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "FAQ updated",
        faq: FAQ.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update FAQ error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === TOGGLE FAQ STATUS ===
  toggleFaqStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isDisabled } = req.body;

      if (typeof isDisabled !== "boolean") {
        return res.status(400).json({ error: "isDisabled must be boolean" });
      }

      const docRef = faqsCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "FAQ not found" });

      await docRef.update({ isDisabled, updatedAt: Timestamp.now() });
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: isDisabled
          ? "FAQ disabled successfully"
          : "FAQ enabled successfully",
        faq: FAQ.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Toggle FAQ status error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = FAQController;
