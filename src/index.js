const dotenv = require("dotenv");
dotenv.config({ debug: true });
require("./config/firebase");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const route = require("./routes");
const app = express();
// Middleware
app.use(cookieParser());
app.use(morgan("combined"));
app.use(
  cors({
    origin: ["https://emoticare-seven.vercel.app", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);
app.get("/", (req, res) => {
  res.send("EmotiCare Backend is running ✅");
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
route(app);
app.listen(process.env.PORT, () =>
  console.log(
    `EmotiCare backend running at: http://127.0.0.1:${process.env.PORT}`
  )
);
