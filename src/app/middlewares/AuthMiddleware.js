const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    let token;

    // 1. Check cookie first
    if (req.cookies?.token) {
      token = req.cookies.token;
      console.log("Token from cookie:", token);
    }
    // 2. Fallback: Authorization header
    else if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token from header:", token);
    }

    if (!token) {
      console.log("No token provided");
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log("Token verified successfully:", decoded);
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({ message: "Token is not valid or expired" });
  }
};
// Middleware admin
const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  next();
};

module.exports = { verifyToken, isAdmin };
