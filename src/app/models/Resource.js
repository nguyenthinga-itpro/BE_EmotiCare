class Resource {
  constructor(
    id,
    title,
    description,
    type,
    url,
    image,
    isDisabled,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.type = type;
    this.url = url;
    this.image = image;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Resource(
      doc.id,
      data.type,
      data.url,
      data.title,
      data.image,
      data.description,
      data.isDisabled,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = Resource;
