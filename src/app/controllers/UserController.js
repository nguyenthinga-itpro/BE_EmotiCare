// controllers/UserController.js
const { adminDB } = require("../../config/firebase");
const User = require("../models/User");

const usersCollection = adminDB.collection("users");

const UserController = {
  // GET all users với phân trang + filter (email, role, gender) + sort
getAllUsers: async (req, res) => {
    try {
      let {
        page = 1,
        pageSize = 10,
        email,
        emailExact = "false",
        role,
        gender,
        sort = "desc",
      } = req.query;

      page = parseInt(page);
      pageSize = parseInt(pageSize);
      emailExact = emailExact === "true"; // convert string -> boolean

      // Sort theo updatedAt
      let query = usersCollection.orderBy(
        "updatedAt",
        sort === "asc" ? "asc" : "desc"
      );

      // Filter role + gender
      if (role) query = query.where("role", "==", role);
      if (gender) query = query.where("gender", "==", gender);

      let allUsers = [];

      if (email) {
        if (emailExact) {
          // Exact match (Firestore query)
          const snapshot = await usersCollection
            .where("email", "==", email)
            .limit(1)
            .get();

          if (snapshot.empty) {
            return res.status(404).json({ error: "User not found" });
          }

          const user = User.fromFirestore(snapshot.docs[0]);
          if (user.isDisabled) {
            return res.status(404).json({ error: "User not found" });
          }

          return res.status(200).json({
            page: 1,
            pageSize: 1,
            total: 1,
            sort: null,
            users: [user],
          });
        } else {
          // Substring match (lọc local)
          const snapshot = await query.get();
          allUsers = snapshot.docs.map((doc) => User.fromFirestore(doc));

          allUsers = allUsers.filter(
            (u) =>
              !u.isDisabled &&
              u.email?.toLowerCase().includes(email.toLowerCase())
          );
        }
      } else {
        // Không có email -> lấy full query
        const snapshot = await query.get();
        allUsers = snapshot.docs
          .map((doc) => User.fromFirestore(doc))
          // .filter((u) => !u.isDisabled);
      }

      // Pagination
      const startIndex = (page - 1) * pageSize;
      const pagedUsers = allUsers.slice(startIndex, startIndex + pageSize);

      res.status(200).json({
        page,
        pageSize,
        total: allUsers.length,
        sort: sort === "asc" ? "oldest" : "newest",
        users: pagedUsers,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  // GET single user
  getUserById: async (req, res) => {
    try {
      const doc = await usersCollection.doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });
      res.status(200).json(User.fromFirestore(doc));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // UPDATE user
  updateUser: async (req, res) => {
    try {
      const userRef = usersCollection.doc(req.params.id);
      const doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });

      const updatedData = { ...req.body, updatedAt: new Date() };
      await userRef.update(updatedData);

      const updatedDoc = await userRef.get();
      res.status(200).json(User.fromFirestore(updatedDoc));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // DELETE user = set isDisabled: true
  deleteUser: async (req, res) => {
    try {
      const userRef = usersCollection.doc(req.params.id);
      const doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });

      await userRef.update({ isDisabled: true, updatedAt: new Date() });

      const updatedDoc = await userRef.get();
      res.status(200).json({
        message: "User disabled successfully",
        user: User.fromFirestore(updatedDoc),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = UserController;
