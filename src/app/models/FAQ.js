class FAQ {
  constructor(id, question, answer, isDisabled, updatedAt) {
    this.id = id;
    this.question = question;
    this.answer = answer;
    this.isDisabled = isDisabled;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new FAQ(
      doc.id,
      data.question,
      data.answer,
      data.isDisabled,
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = FAQ;
