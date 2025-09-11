class Emotion {
  constructor(
    id,
    name,
    category,
    emoji,
    description,
    isDisabled,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.emoji = emoji;
    this.description = description;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Emotion(
      doc.id,
      data.name,
      data.category,
      data.emoji,
      data.description,
      data.isDisabled || false,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = Emotion;
