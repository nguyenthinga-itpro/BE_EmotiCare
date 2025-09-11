const AuthRouter = require("../routes/AuthRouter");
const UserRouter = require("../routes/UserRouter");
const ChatAIRouter = require("../routes/ChatAIRouter");
const ChatSessionRouter = require("../routes/ChatSessionRouter");
const ConversationHistoryRouter = require("../routes/ConversationHistoryRouter");
const EmotionRouter = require("../routes/EmotionRouter");
const FAQRouter = require("../routes/FAQRouter");
const PostcardFavoriteRouter = require("../routes/PostcardFavoriteRouter");
const PostcardRouter = require("../routes/PostcardRouter");
const PostcardShareRouter = require("../routes/PostcardShare");
const ResourceRouter = require("../routes/ResourceRouter");
function route(app) {
  app.use("/auth", AuthRouter);
  app.use("/chat", ChatAIRouter);
  app.use("/user", UserRouter);
  app.use("/chatsession", ChatSessionRouter);
  app.use("/history", ConversationHistoryRouter);
  app.use("/emotion", EmotionRouter);
  app.use("/faq", FAQRouter);
  app.use("/favorite", PostcardFavoriteRouter);
  app.use("/postcard", PostcardRouter);
  app.use("/share", PostcardShareRouter);
  app.use("/resource", ResourceRouter);
}

module.exports = route;
