class PostcardComment {
  constructor(
    id,
    postcardId,
    userId,
    parentId,
    content,
    name,
    avatar,
    createdAt
  ) {
    this.id = id;
    this.postcardId = postcardId;
    this.userId = userId;
    this.parentId = parentId;
    this.content = content;
    this.name = name; // tên người comment
    this.avatar = avatar; // avatar người comment
    this.createdAt = createdAt;
  }

  // Chuyển dữ liệu từ RTDB sang object PostcardComment
  static fromRTDB(id, data) {
    return new PostcardComment(
      id,
      data.postcardId,
      data.userId,
      data.parentId || null,
      data.content,
      data.name || null, // nếu có name trong data
      data.avatar || null, // nếu có avatar trong data
      new Date(data.createdAt).toLocaleString("vi-VN")
    );
  }
}

module.exports = PostcardComment;
