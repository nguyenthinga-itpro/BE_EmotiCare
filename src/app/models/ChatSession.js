class ChatSession {
  constructor(
    id,
    userId,
    chatAIId,
    rating,
    messageCount,
    isCompletetion,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.userId = userId;
    this.chatAIId = chatAIId;
    this.rating = rating;
    this.messageCount = messageCount;
    this.isCompletetion = isCompletetion;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ChatSession(
      doc.id,
      data.userId,
      data.chatAIId,
      data.rating,
      data.messageCount,
      data.isCompletetion,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = ChatSession;
