const express = require("express");
const multer = require("multer");
const FileController = require("../app/controllers/FileController");

const router = express.Router();

// multer config: lưu tạm file vào /uploads
const upload = multer({ dest: "uploads/" });

// route upload
router.post("/upload", upload.single("image"), FileController.uploadImage);
router.patch("/update/:id/image", upload.single("image"), FileController.updateImage);
router.post("/uploaduserimage", upload.single("image"), FileController.uploadUserAvatar);
router.patch("/updateuserimage/:id/image", upload.single("image"), FileController.updateUserImage);
module.exports = router;
