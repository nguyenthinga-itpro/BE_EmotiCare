class PostcardFavorite {
  constructor(id, postcardId, userId, createdAt) {
    this.id = id;
    this.postcardId = postcardId;
    this.userId = userId;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new PostcardFavorite(
      doc.id,
      data.postcardId,
      data.userId,
      data.createdAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = PostcardFavorite;
