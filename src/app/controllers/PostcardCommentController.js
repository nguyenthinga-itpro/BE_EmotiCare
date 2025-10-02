const { adminRTDB, adminDB } = require("../../config/firebase");
const { v4: uuidv4 } = require("uuid");

const commentsRef = adminRTDB.ref("postcardComments");
const usersRef = adminDB.collection("users"); // Firestore

const PostcardCommentController = {
  // === GET COMMENTS BY POSTCARD ID (nested nhiều cấp, sorted) ===
  getCommentsByPostcardId: async (req, res) => {
    try {
      const { postcardId } = req.params;
      const snapshot = await commentsRef
        .orderByChild("postcardId")
        .equalTo(postcardId)
        .once("value");

      const data = snapshot.val() || {};
      const comments = Object.values(data).map((c) => {
        c.replies = c.replies || [];
        return c;
      });

      // Build cây nested
      const map = {};
      comments.forEach((c) => (map[c.id] = c));
      const tree = [];
      comments.forEach((c) => {
        if (c.parentId && map[c.parentId]) {
          map[c.parentId].replies.push(c);
        } else {
          tree.push(c);
        }
      });

      // Sort nested replies theo createdAt
      const sortReplies = (nodes) => {
        nodes.sort((a, b) => a.createdAt - b.createdAt);
        nodes.forEach((n) => sortReplies(n.replies));
      };
      sortReplies(tree);

      res.status(200).json(tree);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // === ADD COMMENT OR REPLY ===
  addComment: async (req, res) => {
    try {
      const { postcardId } = req.params;
      const { userId, content, parentId = null } = req.body;

      if (!content) return res.status(400).json({ error: "Content required" });

      // Lấy user info
      const userDoc = await usersRef.doc(userId).get();
      const user = userDoc.exists ? userDoc.data() : null;
      if (!user) return res.status(404).json({ error: "User not found" });

      const id = uuidv4();
      const newComment = {
        id,
        postcardId,
        userId,
        author: user.name || "Anonymous",
        avatar: user.image || "https://i.pravatar.cc/150?img=3",
        content,
        parentId,
        createdAt: Date.now(),
        replies: [],
      };

      // Lưu comment/reply
      await commentsRef.child(id).set(newComment);

      // Trả về comment vừa tạo (UI sẽ insert đúng vị trí)
      res.status(201).json(newComment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
  // === EDIT COMMENT ===
  editComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, content } = req.body;

      if (!content) return res.status(400).json({ error: "Content required" });

      const snap = await commentsRef.child(id).once("value");
      const comment = snap.val();
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      // Chỉ cho sửa nếu đúng owner comment
      if (comment.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only edit your own comment" });
      }

      // Giới hạn thời gian 1 tiếng như delete
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - comment.createdAt > oneHour) {
        return res.status(403).json({ error: "Can only edit within 1 hour" });
      }

      // Cập nhật nội dung & lưu thêm editedAt
      const updatedData = {
        ...comment,
        content,
        editedAt: Date.now(),
      };

      await commentsRef.child(id).set(updatedData);

      res.status(200).json(updatedData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // === DELETE COMMENT + ALL NESTED REPLIES ===
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const snap = await commentsRef.child(id).once("value");
      const comment = snap.val();
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      const oneHour = 60 * 60 * 1000;
      if (Date.now() - comment.createdAt > oneHour) {
        return res.status(403).json({ error: "Can only delete within 1 hour" });
      }

      // Xây children map
      const allSnap = await commentsRef.once("value");
      const allComments = allSnap.val() || {};
      const childrenMap = {};
      Object.values(allComments).forEach((c) => {
        if (c.parentId) {
          if (!childrenMap[c.parentId]) childrenMap[c.parentId] = [];
          childrenMap[c.parentId].push(c.id);
        }
      });

      // Tìm tất cả nested replies
      const toDelete = new Set();
      const queue = [id];
      while (queue.length) {
        const cid = queue.shift();
        toDelete.add(cid);
        if (childrenMap[cid]) queue.push(...childrenMap[cid]);
      }

      const updates = {};
      toDelete.forEach((cid) => (updates[cid] = null));
      await commentsRef.update(updates);

      res.status(200).json({ message: "Comment and nested replies deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = PostcardCommentController;
