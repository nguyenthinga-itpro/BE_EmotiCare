const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const jwt = require("jsonwebtoken");
const { sendVerificationMail } = require("../services/MailService");
const { isVerificationExpired } = require("../middlewares/AuthMiddleware");
// Tạo OTP ngẫu nhiên 6 số
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
const AuthController = {
  register: async (req, res) => {
    try {
      const { email, password, name, gender, birthday } = req.body;
      console.log("Register request:", email, name, password, gender, birthday);

      // 1. Tạo user trên Firebase Auth (server side)
      const userRecord = await getAuth().createUser({
        email,
        password,
        displayName: name || "",
        disabled: false,
      });

      try {
        // 2. Tạo link verify email
        const actionCodeSettings = {
          url: "http://localhost:5173/verify?email=" + email,
          handleCodeInApp: false,
        };
        const verificationLink = await getAuth().generateEmailVerificationLink(
          email,
          actionCodeSettings
        );

        // Gửi mail
        await sendVerificationMail(email, verificationLink);

        const expireAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        // 3. Lưu thông tin vào Firestore
        const db = getFirestore();
        await db
          .collection("users")
          .doc(userRecord.uid)
          .set({
            name: userRecord.displayName || "",
            email: userRecord.email,
            image: null,
            gender: gender || null, // từ req.body
            dateOfBirth: birthday ? new Date(birthday) : null, // từ req.body
            address: null,
            role: "user",
            isVerify: false,
            verifyExpireAt: expireAt,
            mode: "light",
            isDisabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        // Thành công
        return res.status(201).json({
          message: "User registered. Check your email to verify account.",
          userId: userRecord.uid,
        });
      } catch (firestoreErr) {
        // Nếu lỗi khi lưu Firestore → rollback user trên Auth
        await getAuth().deleteUser(userRecord.uid);
        console.error("Register Firestore error:", firestoreErr);
        return res.status(500).json({
          message: "Register failed, rolled back user creation",
          error: firestoreErr.message,
        });
      }
    } catch (err) {
      console.error("Register Auth error:", err);
      return res.status(500).json({
        message: "Register failed",
        error: err.message,
      });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const { email } = req.body;
      console.log("email", email);
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
      const { idToken, remember } = req.body;
      console.log("Login request body:", req.body);

      const decoded = await getAuth().verifyIdToken(idToken);
      console.log("Decoded Firebase ID token:", decoded);

      const { uid, email: userEmail } = decoded;
      const db = getFirestore();
      const userDoc = await db.collection("users").doc(uid).get();

      if (!userDoc.exists)
        return res.status(404).json({ message: "User not found" });

      const userData = userDoc.data();
      const expiresIn = remember ? "30d" : "1h";
      const cookieExpire = remember ? 30 : 1;

      const appToken = jwt.sign(
        { uid, email: userEmail, role: userData.role || "user" },
        process.env.JWT_SECRET,
        { expiresIn }
      );
      console.log("Generated app JWT:", appToken);

      res.cookie("token", appToken, {
        httpOnly: true,
        secure: false, // dev: localhost ko cần https
        sameSite: "lax", // dev: localhost
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
      });
      console.log("Cookie set successfully");

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
  me: async (req, res) => {
    try {
      console.log("me endpoint, req.user:", req.user);
      const db = getFirestore();
      const userDoc = await db.collection("users").doc(req.user.uid).get();

      if (!userDoc.exists)
        return res.status(404).json({ message: "User not found" });

      const userData = userDoc.data();
      console.log("User data fetched:", userData);

      res.json({
        user: { uid: req.user.uid, email: req.user.email, role: userData.role },
      });
    } catch (err) {
      console.error("Failed /auth/me:", err);
      res
        .status(500)
        .json({ message: "Failed to fetch user", error: err.message });
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
  refreshToken: async (req, res) => {
    try {
      const token = req.cookies.token; // lấy từ cookie HttpOnly
      if (!token) return res.status(401).json({ message: "No token provided" });

      // decode token mà không verify để check UID
      const decoded = jwt.decode(token);
      if (!decoded) return res.status(401).json({ message: "Invalid token" });

      // tạo JWT mới
      const newToken = jwt.sign(
        { uid: decoded.uid, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE } // 30d
      );

      res.cookie("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
      });

      return res.json({ message: "Token refreshed", token: newToken });
    } catch (err) {
      console.error("Refresh token error:", err);
      return res.status(500).json({ message: "Refresh token failed" });
    }
  },
  logout: async (req, res) => {
    try {
      res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
      res.json({ message: "Logout successful" });
    } catch (err) {
      res.status(500).json({ message: "Logout failed", error: err.message });
    }
  },
  // 1. Yêu cầu quên mật khẩu -> gửi OTP
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const db = getFirestore();
      const snapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ message: "User not found" });
      }

      let userDoc;
      snapshot.forEach((doc) => (userDoc = { id: doc.id, ...doc.data() }));

      const otp = generateOTP();
      const expireAt = new Date(Date.now() + 5 * 60 * 1000); // OTP hết hạn sau 5 phút

      await db.collection("password_resets").doc(userDoc.id).set({
        otp,
        email,
        expireAt,
        verified: false,
        createdAt: new Date(),
      });

      await sendVerificationMail(
        email,
        `Your OTP code is: ${otp}. It will expire in 5 minutes.`
      );

      return res.status(200).json({ message: "OTP sent to email" });
    } catch (err) {
      console.error("ForgotPassword error:", err);
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  },

  // 2. Xác thực OTP
  verifyOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp)
        return res.status(400).json({ message: "Email and OTP are required" });

      const db = getFirestore();
      const snapshot = await db
        .collection("password_resets")
        .where("email", "==", email)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ message: "OTP not found" });
      }

      let resetDoc;
      snapshot.forEach((doc) => (resetDoc = { id: doc.id, ...doc.data() }));

      if (resetDoc.verified)
        return res.status(400).json({ message: "OTP already used" });

      if (new Date() > resetDoc.expireAt.toDate()) {
        return res.status(400).json({ message: "OTP expired" });
      }

      if (resetDoc.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      await db.collection("password_resets").doc(resetDoc.id).update({
        verified: true,
        updatedAt: new Date(),
      });

      return res.status(200).json({ message: "OTP verified successfully" });
    } catch (err) {
      console.error("VerifyOTP error:", err);
      return res.status(500).json({ message: "Failed to verify OTP" });
    }
  },

  // 3. Đổi mật khẩu sau khi xác thực OTP
  resetPassword: async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword)
        return res
          .status(400)
          .json({ message: "Email and newPassword are required" });

      const db = getFirestore();
      const snapshot = await db
        .collection("password_resets")
        .where("email", "==", email)
        .get();

      if (snapshot.empty)
        return res.status(404).json({ message: "Reset request not found" });

      let resetDoc;
      snapshot.forEach((doc) => (resetDoc = { id: doc.id, ...doc.data() }));

      if (!resetDoc.verified)
        return res.status(400).json({ message: "OTP not verified" });

      await getAuth().updateUser(resetDoc.id, {
        password: newPassword,
      });

      await db.collection("password_resets").doc(resetDoc.id).delete();

      return res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
      console.error("ResetPassword error:", err);
      return res.status(500).json({ message: "Failed to reset password" });
    }
  },
};

module.exports = AuthController;
