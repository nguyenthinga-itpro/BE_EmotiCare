const jwt = require("jsonwebtoken");
const { getFirestore } = require("firebase-admin/firestore");

// Middleware kiểm tra JWT
const verifyToken = (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { uid, email, role }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res
      .status(401)
      .json({ message: "Token is not valid or expired", error: err.message });
  }
};

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied: Admin only" });
  next();
};

// Helper check verifyExpire
const isVerificationExpired = (verifyExpireAt) => {
  return verifyExpireAt?.toDate() < new Date();
};

// Middleware kiểm tra email trước register
const checkEmailStatus = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const db = getFirestore();
    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();

      if (userData.isVerify) {
        return res
          .status(409)
          .json({ message: "Email already registered and verified" });
      }

      if (isVerificationExpired(userData.verifyExpireAt)) {
        return res
          .status(400)
          .json({ message: "Verification expired. Please register again." });
      }

      return res
        .status(400)
        .json({ message: "Email already registered but not verified" });
    }

    next();
  } catch (err) {
    console.error("checkEmailStatus middleware error:", err);
    return res
      .status(500)
      .json({
        message: "Internal error in email checking",
        error: err.message,
      });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  checkEmailStatus,
  isVerificationExpired,
};
