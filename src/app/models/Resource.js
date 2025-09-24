class Resource {
  constructor(
    id,
    title,
    description,
    type,
    categoryId,
    url,
    image,
    videoId = null,
    channelTitle = null,
    publishedAt = null,
    tags = [],
    content,
    isDisabled = false,
    createdAt = null,
    updatedAt = null
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.type = type;
    this.categoryId = categoryId;
    this.url = url;
    this.image = image;
    this.videoId = videoId;
    this.channelTitle = channelTitle;
    this.publishedAt = publishedAt;
    this.tags = tags;
    this.content = content;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Resource(
      doc.id,
      data.title,
      data.description,
      data.type,
      data.categoryId,
      data.url,
      data.image,
      data.videoId || null,
      data.channelTitle || null,
      data.publishedAt
        ? new Date(data.publishedAt._seconds * 1000).toLocaleString("vi-VN")
        : null,
      data.tags || [],
      data.content,
      data.isDisabled || false,
      data.createdAt
        ? new Date(data.createdAt._seconds * 1000).toLocaleString("vi-VN")
        : null,
      data.updatedAt
        ? new Date(data.updatedAt._seconds * 1000).toLocaleString("vi-VN")
        : null
    );
  }
}

module.exports = Resource;
