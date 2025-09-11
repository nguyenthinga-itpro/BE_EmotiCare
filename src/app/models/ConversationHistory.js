class ConversationHistory {
  constructor(id, sessionId, messageType, sender, message, createdAt) {
    this.id = id;
    this.sessionId = sessionId;
    this.messageType = messageType; // user / ai
    this.message = message;
    this.sender = sender;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ConversationHistory(
      doc.id,
      data.sessionId,
      data.messageType,
      data.message,
      data.sender,
      data.createdAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = ConversationHistory;
