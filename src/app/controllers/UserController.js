// controllers/UserController.js
const { adminDB } = require("../../config/firebase");
const adminAuth = require("firebase-admin").auth();
const User = require("../models/User");
const { FieldPath } = require("firebase-admin").firestore;
const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);
const usersCollection = adminDB.collection("users");
const chatsCollection = adminDB.collection("chatAIs");
const chatSessionsCollection = adminDB.collection("chatSessions");
const resourceCollection = adminDB.collection("resources");
const emotionCollection = adminDB.collection("emotions");
const emotionSessionCollection = adminDB.collection("emotionSessions");
const collectionsMap = {
  users: usersCollection,
  chatSessions: chatSessionsCollection,
  chatAIs: chatsCollection,
  resources: resourceCollection,
  emotions: emotionCollection,
  emotionSessions: emotionSessionCollection,
};
const UserController = {
  // UPDATE USER EMAIL
  updateEmail: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const userId = req.params.id;
      const userRef = usersCollection.doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });

      const userData = doc.data();
      const authUid = userData.authUid || userId;

      // --- Update email trong Firebase Auth ---
      const userRecord = await adminAuth.updateUser(authUid, { email });

      // --- Update email trong Firestore ---
      await userRef.update({
        email,
        updatedAt: new Date(),
      });

      // Lấy lại doc đã update
      const updatedDoc = await userRef.get();

      res.status(200).json({
        message: "Email updated successfully",
        user: { id: updatedDoc.id, ...updatedDoc.data(), authUid },
        authUser: userRecord,
      });
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET ALL USERS (frontend sẽ filter email)
  getAllUsers: async (req, res) => {
    try {
      let {
        pageSize = 10,
        role,
        gender,
        sort = "desc",
        startAfterId,
      } = req.query;
      pageSize = parseInt(pageSize);

      let queryRef = usersCollection;
      let countQueryRef = usersCollection;

      // --- filter role / gender ---
      if (role) {
        queryRef = queryRef.where("role", "==", role);
        countQueryRef = countQueryRef.where("role", "==", role);
      }
      if (gender) {
        queryRef = queryRef.where("gender", "==", gender);
        countQueryRef = countQueryRef.where("gender", "==", gender);
      }

      // --- total users ---
      const snapshotCount = await countQueryRef.count().get();
      const totalUsers = snapshotCount.data().count;

      // --- phân trang ---
      queryRef = queryRef.orderBy("createdAt", sort); // cần orderBy trước startAfter
      if (startAfterId) {
        const startAfterDoc = await usersCollection.doc(startAfterId).get();
        if (startAfterDoc.exists) queryRef = queryRef.startAfter(startAfterDoc);
      }
      queryRef = queryRef.limit(pageSize);

      // --- lấy users ---
      const snapshot = await queryRef.get();
      let users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // --- thêm lastActive từ Auth ---
      const usersWithLastActive = await Promise.all(
        users.map(async (u) => {
          try {
            const authUid = u.authUid || u.id;
            const userRecord = await adminAuth.getUser(authUid);
            const lastActive = userRecord.metadata.lastSignInTime
              ? new Date(userRecord.metadata.lastSignInTime).toISOString()
              : null;

            await usersCollection.doc(u.id).update({ lastActive });
            return { ...u, lastActive };
          } catch (err) {
            console.error("Error fetching Auth user:", err);
            return { ...u, lastActive: null };
          }
        })
      );

      // --- trả về ---
      res.status(200).json({
        pageSize,
        totalUsers,
        users: usersWithLastActive,
        sort: sort === "asc" ? "oldest" : "newest",
        nextCursor: users.length ? users[users.length - 1].id : null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET USER BY ID
  getUserById: async (req, res) => {
    try {
      const doc = await usersCollection.doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });

      const user = User.fromFirestore(doc);
      try {
        const userRecord = await adminAuth.getUser(user.id);
        user.lastActive = userRecord.metadata.lastSignInTime;
      } catch {
        user.lastActive = null;
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // UPDATE USER
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

  // TOGGLE USER STATUS (DISABLE / ENABLE)
  toggleUserStatus: async (req, res) => {
    try {
      const userRef = usersCollection.doc(req.params.id);
      const doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ error: "User not found" });

      const { isDisabled } = req.body;
      if (typeof isDisabled !== "boolean")
        return res.status(400).json({ error: "isDisabled must be boolean" });

      await userRef.update({ isDisabled, updatedAt: new Date() });
      const updatedDoc = await userRef.get();

      res.status(200).json({
        message: isDisabled
          ? "User disabled successfully"
          : "User enabled successfully",
        user: User.fromFirestore(updatedDoc),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getDashboardStats: async (req, res) => {
    try {
      const now = new Date();

      // --- Today ---
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      // --- Yesterday ---
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayStart);

      // --- Total Users ---
      const totalSnap = await usersCollection.count().get();
      const totalUsers = totalSnap.data().count;

      // --- Today's Users ---
      const todaySnap = await usersCollection
        .where("createdAt", ">=", todayStart)
        .where("createdAt", "<", todayEnd)
        .count()
        .get();
      const todaysUsers = todaySnap.data().count;

      // --- Yesterday's Users ---
      const yesterdaySnap = await usersCollection
        .where("createdAt", ">=", yesterdayStart)
        .where("createdAt", "<", yesterdayEnd)
        .count()
        .get();
      const todaysUsersPrev = yesterdaySnap.data().count;

      // --- Week Users ---
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = new Date(weekStart);

      const newUsersSnap = await usersCollection
        .where("createdAt", ">=", weekStart)
        .count()
        .get();
      const newUsers = newUsersSnap.data().count;

      const newUsersPrevSnap = await usersCollection
        .where("createdAt", ">=", prevWeekStart)
        .where("createdAt", "<", prevWeekEnd)
        .count()
        .get();
      const newUsersPrev = newUsersPrevSnap.data().count;

      // --- Week Chats ---
      const newChatsSnap = await chatsCollection
        .where("createdAt", ">=", weekStart)
        .count()
        .get();
      const newChats = newChatsSnap.data().count;

      const newChatsPrevSnap = await chatsCollection
        .where("createdAt", ">=", prevWeekStart)
        .where("createdAt", "<", prevWeekEnd)
        .count()
        .get();
      const newChatsPrev = newChatsPrevSnap.data().count;

      // --- Total Chat Sessions ---
      const totalChatSnap = await chatSessionsCollection.count().get();
      const totalChatSessions = totalChatSnap.data().count;

      // --- Today's New Chat Sessions ---
      const todayChatSnap = await chatSessionsCollection
        .where("createdAt", ">=", todayStart)
        .where("createdAt", "<", todayEnd)
        .count()
        .get();
      const todaysNewChatSessions = todayChatSnap.data().count;

      // --- Yesterday's New Chat Sessions for % ---
      const yesterdayChatSnap = await chatSessionsCollection
        .where("createdAt", ">=", yesterdayStart)
        .where("createdAt", "<", yesterdayEnd)
        .count()
        .get();
      const todaysNewChatSessionsPrev = yesterdayChatSnap.data().count;

      res.status(200).json({
        totalUsers,
        totalUsersPrev: totalUsers - (newUsers - newUsersPrev),
        todaysUsers,
        todaysUsersPrev,
        newUsers,
        newUsersPrev,
        newChats,
        newChatsPrev,
        totalChatSessions,
        todaysNewChatSessions,
        todaysNewChatSessionsPrev,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
  statsByPeriod: async (req, res) => {
    try {
      const { type = "users", period = "week", start, end } = req.query;
      const collection = collectionsMap[type];
      if (!collection) return res.status(400).json({ error: "Invalid type" });

      const now = dayjs();
      let startDate, endDate;

      if (start && end) {
        startDate = dayjs(start);
        endDate = dayjs(end);
      } else {
        switch (period) {
          case "week":
            startDate = now.startOf("week");
            endDate = now.endOf("week");
            break;
          case "month":
            startDate = now.startOf("month");
            endDate = now.endOf("month");
            break;
          case "year":
            startDate = now.startOf("year");
            endDate = now.endOf("year");
            break;
          default:
            return res.status(400).json({ error: "Invalid period" });
        }
      }

      // --- Tạo keys & dataBuckets ---
      let keys = [];
      switch (period) {
        case "week":
          for (
            let d = startDate.startOf("week");
            d.isBefore(endDate) || d.isSame(endDate, "day");
            d = d.add(1, "week")
          ) {
            keys.push(`${d.year()}-W${d.isoWeek()}`);
          }
          break;
        case "month":
          for (
            let d = startDate.startOf("month");
            d.isBefore(endDate) || d.isSame(endDate, "month");
            d = d.add(1, "month")
          ) {
            keys.push(`${d.year()}-${d.month() + 1}`);
          }
          break;
        case "year":
          for (let y = startDate.year(); y <= endDate.year(); y++)
            keys.push(`${y}`);
          break;
      }

      // Khởi tạo dataBuckets
      const dataBuckets = {};
      keys.forEach((k) => {
        if (type === "chatSessions" || type === "emotionSessions") {
          dataBuckets[k] = {}; // mỗi key lưu object chi tiết AI / emotion
        } else {
          dataBuckets[k] = { Current: 0 }; // users
        }
      });

      // Lấy dữ liệu
      const snapshot = await collection
        .where("createdAt", ">=", startDate.toDate())
        .where("createdAt", "<=", endDate.toDate())
        .get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const created = dayjs(data.createdAt.toDate());
        let key;
        if (period === "week") key = `${created.year()}-W${created.isoWeek()}`;
        if (period === "month")
          key = `${created.year()}-${created.month() + 1}`;
        if (period === "year") key = `${created.year()}`;

        if (!dataBuckets[key]) return;

        if (type === "users") {
          if (!data.isVerify) return;
          dataBuckets[key].Current++;
        }

        if (type === "chatSessions") {
          const aiId = data.chatAIId || "Unknown";
          dataBuckets[key][aiId] = (dataBuckets[key][aiId] || 0) + 1;
        }

        if (type === "emotionSessions") {
          const emotionId = data.emotionId || "Unknown";
          dataBuckets[key][emotionId] = (dataBuckets[key][emotionId] || 0) + 1;
        }
      });

      // --- Lấy chi tiết ChatAIs ---
      if (type === "chatSessions") {
        const aiIdsSet = new Set();
        snapshot.forEach((doc) => {
          const aiId = doc.data().chatAIId || "Unknown";
          aiIdsSet.add(aiId);
        });

        const aiIds = Array.from(aiIdsSet);
        const aiDetails = {};
        for (let i = 0; i < aiIds.length; i += 10) {
          const batchIds = aiIds.slice(i, i + 10);
          const batchSnap = await chatsCollection
            .where(FieldPath.documentId(), "in", batchIds)
            .get();
          batchSnap.forEach((doc) => {
            aiDetails[doc.id] = doc.data();
          });
        }
        console.log(type, period, dataBuckets, aiDetails);
        return res
          .status(200)
          .json({ type, period, data: dataBuckets, aiDetails });
      }

      // --- Lấy chi tiết Emotion ---
      if (type === "emotionSessions") {
        const emotionIdsSet = new Set();
        snapshot.forEach((doc) => {
          const emotionId = doc.data().emotionId || "Unknown";
          emotionIdsSet.add(emotionId);
        });
        const emotionIds = Array.from(emotionIdsSet);
        const emotionDetails = {};
        for (let i = 0; i < emotionIds.length; i += 10) {
          const batchIds = emotionIds.slice(i, i + 10);
          const batchSnap = await emotionCollection
            .where(FieldPath.documentId(), "in", batchIds)
            .get();
          batchSnap.forEach((doc) => {
            emotionDetails[doc.id] = doc.data();
          });
        }
        console.log(type, period, dataBuckets, emotionDetails);
        return res
          .status(200)
          .json({ type, period, data: dataBuckets, emotionDetails });
      }

      // --- Trả về dữ liệu users ---
      res.status(200).json({ type, period, data: dataBuckets });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = UserController;
