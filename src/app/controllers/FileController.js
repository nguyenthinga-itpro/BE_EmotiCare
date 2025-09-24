const { adminDB } = require("../../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");
const cloudinary = require("../../config/cloudinary");

const postcardsCollection = adminDB.collection("postcards");
const usersCollection = adminDB.collection("users");
const FileController = {
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "emoticare",
      });
      res
        .status(200)
        .json({ message: "Upload thành công", imageUrl: result.secure_url });
    } catch (err) {
      console.error("Upload file error:", err);
      res.status(500).json({ error: err.message });
    }
  },
  updateImage: async (req, res) => {
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      // Upload ảnh mới lên Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "emoticare",
        overwrite: true,
      });

      const docRef = postcardsCollection.doc(id);
      const docSnap = await docRef.get();
      if (!docSnap.exists)
        return res.status(404).json({ error: "Postcard not found" });

      // Update field image
      await docRef.update({
        image: result.secure_url,
        updatedAt: Timestamp.now(),
      });

      res.status(200).json({
        message: docSnap.data().image
          ? "Image replaced successfully"
          : "Image uploaded successfully",
        imageUrl: result.secure_url,
        postcard: { id, ...docSnap.data(), image: result.secure_url },
      });
    } catch (err) {
      console.error("Update image error:", err);
      res.status(500).json({ error: err.message });
    }
  },
  uploadUserAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "emoticare/users",
      });

      res
        .status(200)
        .json({ message: "Upload thành công", imageUrl: result.secure_url });
    } catch (err) {
      console.error("Upload file error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  updateUserImage: async (req, res) => {
    try {
      const { id } = req.params;
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      // Upload ảnh mới lên Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "emoticare/users",
        overwrite: true,
      });

      const docRef = usersCollection.doc(id);
      const docSnap = await docRef.get();
      if (!docSnap.exists)
        return res.status(404).json({ error: "User not found" });

      // Update field image
      await docRef.update({
        image: result.secure_url,
        updatedAt: Timestamp.now(),
      });

      res.status(200).json({
        message: docSnap.data().image
          ? "Avatar replaced successfully"
          : "Avatar uploaded successfully",
        imageUrl: result.secure_url,
        user: { id, ...docSnap.data(), image: result.secure_url },
      });
    } catch (err) {
      console.error("Update image error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = FileController;
