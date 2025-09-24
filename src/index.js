// Dotenv
const dotenv = require("dotenv");
dotenv.config({ debug: true });

// Firebase Admin đã khởi tạo trong config/firebase.js
require("./config/firebase");

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const route = require("./routes");

const app = express(); // <-- phải khai báo trước khi dùng middleware

// Middleware
app.use(cookieParser());
app.use(morgan("combined"));
app.use(
  cors({
    origin: "http://localhost:5173", // frontend
    credentials: true, // cho phép cookie
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
route(app);

// Start server
app.listen(process.env.PORT, () =>
  console.log(
    `EmotiCare backend running at: http://localhost:${process.env.PORT}`
  )
);
