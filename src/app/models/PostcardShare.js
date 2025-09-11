class PostcardShare {
  constructor(id, postcardId, userId, shareTo, createdAt) {
    this.id = id;
    this.postcardId = postcardId;
    this.userId = userId;
    this.shareTo = shareTo;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new PostcardShare(
      doc.id,
      data.postcardId,
      data.userId,
      data.shareTo,
      data.createdAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = PostcardShare;
