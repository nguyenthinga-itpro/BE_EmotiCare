class Postcard {
  constructor(
    id,
    title,
    description,
    image,
    category,
    music,
    isDisabled,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.image = image;
    this.category = category;
    this.music = music;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Postcard(
      doc.id,
      data.title,
      data.description,
      data.image,
      data.category,
      data.music,
      data.isDisabled,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = Postcard;
