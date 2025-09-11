const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const jwt = require("jsonwebtoken");
const { sendVerificationMail } = require("../services/MailService");
const { isVerificationExpired } = require("../middlewares/AuthMiddleware");

const AuthController = {
  register: async (req, res) => {
    try {
      const { email, password, name } = req.body;

      const userRecord = await getAuth().createUser({
        email,
        password,
        displayName: name || "",
        emailVerified: false,
      });

      const actionCodeSettings = {
        url: "http://localhost:5173/verify?email=" + email,
        handleCodeInApp: false,
      };
      const verificationLink = await getAuth().generateEmailVerificationLink(
        email,
        actionCodeSettings
      );

      const expireAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 ngày
      await sendVerificationMail(email, verificationLink);

      const db = getFirestore();
      await db
        .collection("users")
        .doc(userRecord.uid)
        .set({
          name: userRecord.displayName || "",
          email: userRecord.email,
          image: null,
          gender: null,
          dateOfBirth: null,
          address: null,
          role: "user",
          isVerify: false,
          verifyExpireAt: expireAt,
          mode: "light",
          isDisabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      return res.status(201).json({
        message: "User registered. Check your email to verify account.",
        userId: userRecord.uid,
      });
    } catch (err) {
      console.error("Register error:", err);
      return res
        .status(500)
        .json({ message: "Register failed", error: err.message });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const { email } = req.body;
      const db = getFirestore();
      const snapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (snapshot.empty)
        return res.status(404).json({ message: "User not found" });

      let userDoc;
      snapshot.forEach((doc) => (userDoc = { id: doc.id, ...doc.data() }));

      if (userDoc.isVerify)
        return res.status(400).json({ message: "Email already verified" });

      if (isVerificationExpired(userDoc.verifyExpireAt)) {
        return res.status(400).json({
          message: "Verification link expired. Please register again.",
        });
      }

      await db
        .collection("users")
        .doc(userDoc.id)
        .update({ isVerify: true, updatedAt: new Date() });
      return res.status(200).json({ message: "Email verified successfully!" });
    } catch (err) {
      console.error("Verify backend error:", err);
      return res
        .status(500)
        .json({ message: "Verify backend failed", error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { idToken } = req.body;
      const decoded = await getAuth().verifyIdToken(idToken);
      const { uid, email: userEmail } = decoded;

      const db = getFirestore();
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists)
        return res.status(404).json({ message: "User not found" });

      const userData = userDoc.data();
      const appToken = jwt.sign(
        { uid, email: userEmail, role: userData.role || "user" },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRE,
        }
      );

      res.cookie("token", appToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
      });

      return res.json({
        message: "Login success",
        token: appToken,
        user: { uid, email: userEmail, role: userData.role },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res
        .status(401)
        .json({ message: "Login failed", error: err.message });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { token } = req.body;
      const decoded = await getAuth().verifyIdToken(token);
      const { uid, email, name, picture } = decoded;

      const db = getFirestore();
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();

      let role = "user";
      if (!userDoc.exists) {
        await userRef.set({
          name: name || "",
          email,
          image: picture || null,
          role: "user",
          isVerify: true,
          isDisabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        const userData = userDoc.data();
        role = userData.role || "user";
        await userRef.update({ updatedAt: new Date() });
      }

      const appToken = jwt.sign({ uid, email, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });
      res.cookie("token", appToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
      });

      return res.json({
        message: "Google login success",
        token: appToken,
        user: { uid, email, name, picture, role },
      });
    } catch (err) {
      console.error("Google login error:", err);
      return res.status(401).json({ error: "Invalid Google token" });
    }
  },

  logout: async (req, res) => {
    try {
      res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
      if (req.user?.uid) await getAuth().revokeRefreshTokens(req.user.uid);
      return res.status(200).json({ message: "Logout successful" });
    } catch (err) {
      console.error("Logout error:", err);
      return res
        .status(500)
        .json({ message: "Logout failed", error: err.message });
    }
  },
};

module.exports = AuthController;
