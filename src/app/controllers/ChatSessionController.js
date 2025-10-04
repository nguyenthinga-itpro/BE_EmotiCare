const { adminRTDB, adminDB } = require("../../config/firebase");
const { v4: uuidv4 } = require("uuid");
const openai = require("../../config/openai");

const ChatSessionController = {
  // === GET ALL CHAT SESSIONS WITH PAGINATION ===
  getAllSessions: async (req, res) => {
    try {
      const { pageSize = 10, startAfter } = req.query;
      const sessionsRef = adminRTDB.ref("chatSessions");

      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000; // 30 ngày trước

      // Query: lấy các session updatedAt >= 30 ngày trước
      let query = sessionsRef
        .orderByChild("updatedAt")
        .startAt(thirtyDaysAgo) // chỉ lấy session từ 30 ngày gần nhất
        .limitToLast(Number(pageSize));

      if (startAfter) {
        query = query.endAt(Number(startAfter) - 1);
      }

      const snap = await query.get();
      const snapVal = snap.val();

      if (!snapVal)
        return res.status(200).json({ sessions: [], nextCursor: null });

      const sessionEntries = Object.entries(snapVal); // [ [id, session], ... ]

      // Load chatAIs song song
      const sessions = await Promise.all(
        sessionEntries.map(async ([sessionId, session]) => {
          session.id = sessionId;

          // Lấy thêm name + image từ chatAIs
          const chatAIDoc = await adminDB
            .collection("chatAIs")
            .doc(session.chatAIId)
            .get();

          if (chatAIDoc.exists) {
            const chatAIData = chatAIDoc.data();
            session.chatAIName = chatAIData.name || "AI Assistant";
            session.aiAvatar = chatAIData.image || "";
          } else {
            session.chatAIName = "AI Assistant";
            session.aiAvatar = "";
          }

          // Lấy lastMessage nếu có
          const messagesArr = session.messages
            ? Object.values(session.messages)
            : [];
          session.lastMessage =
            messagesArr.length > 0
              ? messagesArr[messagesArr.length - 1].text
              : "";

          return session;
        })
      );

      // sort descending theo updatedAt
      sessions.sort((a, b) => b.updatedAt - a.updatedAt);

      const nextCursor =
        sessions.length > 0 ? sessions[sessions.length - 1].updatedAt : null;

      res
        .status(200)
        .json({ sessions, nextCursor, pageSize: Number(pageSize) });
    } catch (err) {
      console.error("Get all sessions error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === CREATE NEW CHAT SESSION ===
  createSession: async (req, res) => {
    try {
      const { userId, chatAIId } = req.body;
      if (!userId || !chatAIId)
        return res.status(400).json({ error: "userId, chatAIId required" });

      const sessionId = uuidv4();

      // Lấy systemPrompt snapshot từ chatAIs
      const personaDoc = await adminDB
        .collection("chatAIs")
        .doc(chatAIId)
        .get();
      if (!personaDoc.exists)
        return res.status(404).json({ error: "Chat AI not found" });
      const systemPrompt = personaDoc.data().systemPrompt;
      const initialAIReply = personaDoc.data().defaultGreeting || "";
      const aiAvatar = personaDoc.data().image || "";
      // Tạo session RTDB
      await adminRTDB.ref(`chatSessions/${sessionId}`).set({
        userId,
        chatAIId,
        systemPrompt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDisabled: false,
      });

      const messagesRef = adminRTDB.ref(`chatSessions/${sessionId}/messages`);

      // Lưu message đầu của user
      // const userMsgId = uuidv4();
      // await messagesRef.child(userMsgId).set({
      //   id: userMsgId,
      //   sender: "user",
      //   createdAt: Date.now(),
      // });

      // AI reply với context
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          // { role: "user", content: initialMessage },
        ],
      });

      const aiReply = completion.choices[0].message.content;
      const aiMsgId = uuidv4();
      await messagesRef.child(aiMsgId).set({
        id: aiMsgId,
        sender: "ai",
        // text: aiReply,
        text: initialAIReply,
        createdAt: Date.now(),
      });

      await adminRTDB
        .ref(`chatSessions/${sessionId}`)
        .update({ updatedAt: Date.now() });

      res.status(201).json({ sessionId, aiReply, aiAvatar });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // === SEND MESSAGE WITH FULL CONTEXT ===
  sendMessage: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { sender, text } = req.body;
      if (!sender || !text)
        return res.status(400).json({ error: "sender and text required" });

      const sessionRef = adminRTDB.ref(`chatSessions/${sessionId}`);
      const sessionSnap = await sessionRef.get();
      if (!sessionSnap.exists())
        return res.status(404).json({ error: "Chat session not found" });

      const systemPrompt = sessionSnap.val().systemPrompt;
      const messagesRef = sessionRef.child("messages");

      // Lưu message user
      const msgId = uuidv4();
      await messagesRef
        .child(msgId)
        .set({ id: msgId, sender, text, createdAt: Date.now() });

      let aiReply = null;
      if (sender === "user") {
        // Lấy toàn bộ lịch sử chat
        const historySnap = await messagesRef.get();
        const context = [{ role: "system", content: systemPrompt }];
        historySnap.forEach((child) => {
          const m = child.val();
          context.push({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          });
        });
        // Gửi context + message mới cho AI
        context.push({ role: "user", content: text });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: context,
        });
        aiReply = completion.choices[0].message.content;

        // Lưu AI reply
        const aiMsgId = uuidv4();
        await messagesRef.child(aiMsgId).set({
          id: aiMsgId,
          sender: "ai",
          text: aiReply,
          createdAt: Date.now(),
        });
      }

      await sessionRef.update({ updatedAt: Date.now() });
      res.status(200).json({ aiReply });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // === GET SESSION INFO ===
  getSessionById: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const sessionSnap = await adminRTDB
        .ref(`chatSessions/${sessionId}`)
        .get();
      if (!sessionSnap.exists())
        return res.status(404).json({ error: "Chat session not found" });
      res.status(200).json({ id: sessionId, ...sessionSnap.val() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // === SSE REALTIME SUBSCRIBE ===
  subscribeSession: (req, res) => {
    try {
      const { sessionId } = req.params;
      const messagesRef = adminRTDB.ref(`chatSessions/${sessionId}/messages`);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const listener = messagesRef.on("child_added", (snapshot) => {
        const message = snapshot.val();
        res.write(`data: ${JSON.stringify(message)}\n\n`);
      });

      req.on("close", () => messagesRef.off("child_added", listener));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ChatSessionController;
