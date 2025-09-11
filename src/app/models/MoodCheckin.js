class MoodCheckin {
  constructor(
    id,
    userId,
    emotionId,
    intensity,
    note,
    createdAt
  ) {
    this.id = id;
    this.userId = userId;
    this.emotionId = emotionId;
    this.intensity = intensity;
    this.note = note;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new MoodCheckin(
      doc.id,
      data.userId,
      data.emotionId,
      data.intensity,
      data.note,
      data.createdAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = MoodCheckin;
