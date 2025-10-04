// models/ChatSession.js
class ChatSession {
  constructor(
    id,
    userId,
    chatAIId,
    systemPrompt,
    createdAt,
    updatedAt,
    isDisabled
  ) {
    this.id = id;
    this.userId = userId;
    this.chatAIId = chatAIId;
    this.systemPrompt = systemPrompt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isDisabled = isDisabled;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ChatSession(
      doc.id,
      data.userId,
      data.chatAIId,
      data.systemPrompt,
      data.createdAt,
      data.updatedAt,
      data.isDisabled
    );
  }
}

module.exports = ChatSession;
