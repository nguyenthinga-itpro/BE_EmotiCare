// // Dotenv
const dotenv = require("dotenv");
dotenv.config({ debug: true });

// Firebase Admin đã khởi tạo trong config/firebase.js
require("./config/firebase");
//const spotifyRoutes = require("./routes/PostcardSpotifyPlayerRouter");
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
    origin: "https://emoticare-seven.vercel.app",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.get("/", (req, res) => {
  res.send("EmotiCare Backend is running ✅");
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//app.use("/", spotifyRoutes);
// Routes
route(app);

// Start server
app.listen(process.env.PORT, () =>
  console.log(
    `EmotiCare backend running at: http://127.0.0.1:${process.env.PORT}`
  )
);
// const dotenv = require("dotenv");
// dotenv.config({ debug: true });
// require("./config/firebase");

// const express = require("express");
// const morgan = require("morgan");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
//

// const app = express();
// app.use(
//   cors({
//     origin: "http://localhost:5173", // bỏ dấu / cuối
//     credentials: true, // cho phép cookie
//   })
// );
// // Middleware
// app.use(cookieParser());
// app.use(morgan("combined"));
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL,
//     credentials: true,
//   })
// );
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // CSP để Web Playback SDK load nhạc từ data URI
// app.use((req, res, next) => {
//   res.setHeader(
//     "Content-Security-Policy",
//     "default-src 'self'; media-src 'self' data: https:;"
//   );
//   next();
// });

// // Routes
//

// // Start server
// app.listen(process.env.PORT, () =>
//   console.log(
//     `EmotiCare backend running at: http://127.0.0.1:${process.env.PORT}`
//   )
// );
