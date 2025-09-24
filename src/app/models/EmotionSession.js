class EmotionSession {
  constructor(
    id,
    userId,
    emotionId,
    intensity,
    isDisabled,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.userId = userId;
    this.emotionId = emotionId;
    this.intensity = intensity;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new EmotionSession(
      doc.id,
      data.userId,
      data.emotionId,
      data.intensity,
      data.isDisabled || false,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = EmotionSession;
