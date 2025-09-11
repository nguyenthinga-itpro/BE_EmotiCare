// Dotenv
const dotenv = require("dotenv");
dotenv.config({ debug: true });

// Firebase Admin đã khởi tạo trong config/firebase.js
require("./config/firebase");

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const route = require("./routes");

const app = express();

app.use(morgan("combined"));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
route(app);

// Start server
app.listen(process.env.PORT, () =>
  console.log(`EmotiCare backend running at: http://localhost:${process.env.PORT}`)
);
