// Dotenv
const dotenv = require("dotenv");
dotenv.config();

// Initialize Firebase
const { initializeFirebaseApp } = require("./config/firebase");
initializeFirebaseApp();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const route = require("./routes");

const app = express();

app.use(morgan("combined"));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

route(app);

app.listen(process.env.PORT, () =>
  console.log(`EmotiCare: http://localhost:${process.env.PORT}`)
);
