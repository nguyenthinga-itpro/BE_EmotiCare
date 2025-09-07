const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { sendVerificationMail } = require("../services/MailService");

const AuthController = {
  register: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // 1️⃣ Tạo user trong Firebase Auth
      const userRecord = await getAuth().createUser({
        email,
        password,
        emailVerified: false,
      });

      // 2️⃣ Tạo link xác thực email
      const actionCodeSettings = {
        url: "http://localhost:5173/verify", // trang frontend
        handleCodeInApp: false,
      };

      const verificationLink = await getAuth().generateEmailVerificationLink(
        email,
        actionCodeSettings
      );

      // 3️⃣ Gửi mail xác thực
      await sendVerificationMail(email, verificationLink);

      // 4️⃣ Lưu vào Firestore collection "users"
      const db = getFirestore();
      await db.collection("users").doc(userRecord.uid).set({
        email: userRecord.email,
        createdAt: new Date(),
        emailVerified: false,
      });

      return res.status(201).json({
        message: "User registered. Check your email to verify account.",
        userId: userRecord.uid,
      });
    } catch (err) {
      console.error("❌ Register error:", err);
      return res
        .status(500)
        .json({ message: "Register failed", error: err.message });
    }
  },

  login: async (req, res) => {
    return res.json({ message: "Login API not implemented yet" });
  },
};

module.exports = AuthController;
