const { adminDB } = require("../../config/firebase");
const PostcardShare = require("../models/PostcardShare");

const sharesCollection = adminDB.collection("postcardShares");

const PostcardShareController = {
  // GET all shares with pagination
  getAll: async (req, res) => {
    try {
      let { page = 1, pageSize = 10 } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      const snapshot = await sharesCollection
        .orderBy("createdAt", "desc")
        .get();

      const allShares = snapshot.docs.map((doc) =>
        PostcardShare.fromFirestore(doc)
      );

      const startIndex = (page - 1) * pageSize;
      const pagedShares = allShares.slice(startIndex, startIndex + pageSize);

      res.status(200).json({
        page,
        pageSize,
        total: allShares.length,
        shares: pagedShares,
      });
    } catch (err) {
      console.error("Get all postcard shares error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET single share by ID
  getById: async (req, res) => {
    try {
      const doc = await sharesCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Share not found" });

      res.status(200).json(PostcardShare.fromFirestore(doc));
    } catch (err) {
      console.error("Get postcard share by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // CREATE new share
  create: async (req, res) => {
    try {
      const { postcardId, userId, shareTo } = req.body;
      if (!postcardId || !userId || !shareTo)
        return res
          .status(400)
          .json({ error: "postcardId, userId and shareTo required" });

      const now = new Date().toISOString();
      const newDoc = sharesCollection.doc();
      await newDoc.set({
        postcardId,
        userId,
        shareTo,
        createdAt: now,
      });

      const doc = await newDoc.get();
      res.status(201).json({
        message: "Share created successfully",
        share: PostcardShare.fromFirestore(doc),
      });
    } catch (err) {
      console.error("Create postcard share error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE share by ID
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = sharesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Share not found" });

      await docRef.delete();
      res.status(200).json({ message: "Share deleted successfully" });
    } catch (err) {
      console.error("Delete postcard share error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = PostcardShareController;
