const express = require("express");
const router = express.Router();
const PostcardCommentController = require("../app/controllers/PostcardCommentController");

// Lấy tất cả comment (bao gồm cả reply)
router.get(
  "/:postcardId/comments",
  PostcardCommentController.getCommentsByPostcardId
);
router.put("/:id", PostcardCommentController.editComment);
// Tạo comment mới (parentId để xác định comment cha)
router.post("/:postcardId/comments", PostcardCommentController.addComment);

// Xóa comment (chỉ trong vòng 1 giờ)
router.delete("/:id", PostcardCommentController.deleteComment);

module.exports = router;
