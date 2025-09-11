const { adminDB } = require("../../config/firebase");
const Resource = require("../models/Resource");

const resourcesCollection = adminDB.collection("resources");

const ResourceController = {
  // GET all resources với phân trang
  getAll: async (req, res) => {
    try {
      let { page = 1, pageSize = 10 } = req.query;
      page = parseInt(page);
      pageSize = parseInt(pageSize);

      const snapshot = await resourcesCollection
        .orderBy("updatedAt", "desc")
        .get();
      const allResources = snapshot.docs
        .map((doc) => Resource.fromFirestore(doc))
        .filter((r) => !r.isDisabled);

      const startIndex = (page - 1) * pageSize;
      const pagedResources = allResources.slice(
        startIndex,
        startIndex + pageSize
      );

      res.status(200).json({
        page,
        pageSize,
        total: allResources.length,
        resources: pagedResources,
      });
    } catch (err) {
      console.error("Get all resources error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET single resource by ID
  getById: async (req, res) => {
    try {
      const doc = await resourcesCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Resource not found" });
      res.status(200).json(Resource.fromFirestore(doc));
    } catch (err) {
      console.error("Get resource by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // CREATE new resource
  create: async (req, res) => {
    try {
      const { title, description, type, url, image } = req.body;
      if (!title || !type || !url)
        return res
          .status(400)
          .json({ error: "Title, type, and url are required" });

      const now = new Date().toISOString();
      const newDoc = resourcesCollection.doc();

      await newDoc.set({
        title,
        description: description || "",
        type,
        url,
        image: image || "",
        isDisabled: false,
        createdAt: now,
        updatedAt: now,
      });

      const doc = await newDoc.get();
      res
        .status(201)
        .json({
          message: "Resource created",
          resource: Resource.fromFirestore(doc),
        });
    } catch (err) {
      console.error("Create resource error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // UPDATE resource by ID
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      updates.updatedAt = new Date().toISOString();

      const docRef = resourcesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Resource not found" });

      await docRef.update(updates);

      const updatedDoc = await docRef.get();
      res
        .status(200)
        .json({
          message: "Resource updated",
          resource: Resource.fromFirestore(updatedDoc),
        });
    } catch (err) {
      console.error("Update resource error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE resource = set isDisabled: true
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = resourcesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Resource not found" });

      await docRef.update({
        isDisabled: true,
        updatedAt: new Date().toISOString(),
      });

      const updatedDoc = await docRef.get();
      res
        .status(200)
        .json({
          message: "Resource disabled successfully",
          resource: Resource.fromFirestore(updatedDoc),
        });
    } catch (err) {
      console.error("Delete resource error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ResourceController;
