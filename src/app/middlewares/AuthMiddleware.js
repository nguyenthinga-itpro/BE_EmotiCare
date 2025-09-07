const AuthMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];
  if (token === "fake-jwt-token") {
    return next();
  }
  return res.status(403).json({ message: "Unauthorized" });
};

module.exports = AuthMiddleware;
