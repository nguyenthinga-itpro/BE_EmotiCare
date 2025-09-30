class ChatAI {
  constructor(
    id,
    userId,
    name,
    image,
    categoryId,
    systemPrompt,
    defaultGreeting,
    description,
    isDisabled,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.image = image;
    this.categoryId = categoryId;
    this.systemPrompt = systemPrompt;
    this.defaultGreeting = defaultGreeting;
    this.description = description;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ChatAI(
      doc.id,
      data.userId,
      data.name,
      data.image,
      data.categoryId,
      data.systemPrompt,
      data.defaultGreeting,
      data.description,
      data.isDisabled,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = ChatAI;
