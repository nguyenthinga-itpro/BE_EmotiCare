const OpenAI = require("openai");
// const dotenv = require("dotenv");
// dotenv.config();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = client;
