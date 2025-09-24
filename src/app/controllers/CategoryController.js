const { adminDB } = require("../../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");
const Category = require("../models/Category");

const categoriesCollection = adminDB.collection("categories");

const CategoryController = {
  // === GET ALL CATEGORIES (pagination) ===
  getAll: async (req, res) => {
    try {
      let { pageSize = 10, sort = "desc", startAfterId } = req.query;
      pageSize = parseInt(pageSize);

      let queryRef = categoriesCollection;
      const snapshotCount = await categoriesCollection.count().get();
      const total = snapshotCount.data().count;

      queryRef = queryRef.orderBy("updatedAt", sort);
      if (startAfterId) {
        const startAfterDoc = await categoriesCollection
          .doc(startAfterId)
          .get();
        if (startAfterDoc.exists) queryRef = queryRef.startAfter(startAfterDoc);
      }
      queryRef = queryRef.limit(pageSize);

      const snapshot = await queryRef.get();
      const categories = snapshot.docs.map((doc) =>
        Category.fromFirestore(doc)
      );

      res.status(200).json({
        pageSize,
        total,
        categories,
        sort: sort === "asc" ? "oldest" : "newest",
        nextCursor: categories.length
          ? categories[categories.length - 1].id
          : null,
      });
    } catch (err) {
      console.error("Get all categories error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === GET CATEGORY BY ID ===
  getById: async (req, res) => {
    try {
      const doc = await categoriesCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Category not found" });

      res.status(200).json(Category.fromFirestore(doc));
    } catch (err) {
      console.error("Get category by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === CREATE CATEGORY ===
  create: async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const newCategory = {
        name,
        description: description || "",
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await categoriesCollection.add(newCategory);
      const createdDoc = await docRef.get();

      res.status(201).json({ id: docRef.id, ...createdDoc.data() });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // === UPDATE CATEGORY ===
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: Timestamp.now() };

      const docRef = categoriesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Category not found" });

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Category updated",
        category: Category.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update category error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === TOGGLE CATEGORY STATUS ===
  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isDisabled } = req.body;

      if (typeof isDisabled !== "boolean")
        return res.status(400).json({ error: "isDisabled must be boolean" });

      const docRef = categoriesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Category not found" });

      await docRef.update({ isDisabled, updatedAt: Timestamp.now() });
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: isDisabled
          ? "Category disabled successfully"
          : "Category enabled successfully",
        category: Category.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Toggle category status error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = CategoryController;
