const jwt = require("jsonwebtoken");

class User {
  constructor(
    id,
    name,
    email,
    password,
    image,
    gender,
    dateOfBirth,
    address,
    role,
    isVerify,
    mode,
    lastActive,
    isDisabled,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.image = image;
    this.gender = gender;
    this.dateOfBirth = dateOfBirth;
    this.address = address;
    this.role = role;
    this.isVerify = isVerify;
    this.mode = mode;
    this.lastActive = lastActive;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new User(
      doc.id,
      data.name,
      data.email,
      data.password,
      data.image,
      data.gender,
      data.dateOfBirth,
      data.address,
      data.role,
      data.isVerify,
      data.mode,
      data.lastActive,
      data.isDisabled,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }

  getSignedJwtToken() {
    return jwt.sign(
      { id: this.id, email: this.email },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || "1d",
      }
    );
  }
}

module.exports = User;
