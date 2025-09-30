class Category {
  constructor(id, name, description, isDisabled, image, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.isDisabled = isDisabled;
    this.image = image;
    this.description = description || "";
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Category(
      doc.id,
      data.name,
      data.description,
      data.isDisabled,
      data.image,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = Category;
