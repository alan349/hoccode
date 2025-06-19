require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
let userSteps = {};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userSteps[chatId]) {
    userSteps[chatId] = { step: 0, data: {} };
    bot.sendMessage(chatId, "📦 Nhập tên project Vercel bạn muốn tạo:");
    return;
  }

  const step = userSteps[chatId].step;

  if (step === 0) {
    userSteps[chatId].data.projectName = text;
    userSteps[chatId].step++;
    bot.sendMessage(chatId, "🔐 Nhập TELEGRAM_BOT_TOKEN (sẽ dùng làm biến môi trường):");
  } else if (step === 1) {
    userSteps[chatId].data.envToken = text;
    userSteps[chatId].step++;
    bot.sendMessage(chatId, "💬 Nhập TELEGRAM_CHAT_ID (sẽ dùng làm biến môi trường):");
  } else if (step === 2) {
    userSteps[chatId].data.envChatId = text;

    const { projectName, envToken, envChatId } = userSteps[chatId].data;

    try {
      // 1. Tạo project trên Vercel
      await axios.post(
        "https://api.vercel.com/v13/projects",
        {
          name: projectName,
          gitRepository: {
            type: "github",
            repo: "alan349/602ver3"
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      // 2. Thêm biến môi trường
      await axios.post(
        `https://api.vercel.com/v9/projects/${projectName}/env`,
        [
          {
            key: "TELEGRAM_BOT_TOKEN",
            value: envToken,
            target: ["production"]
          },
          {
            key: "TELEGRAM_CHAT_ID",
            value: envChatId,
            target: ["production"]
          }
        ],
        {
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      const link = `https://${projectName}.vercel.app`;
      bot.sendMessage(chatId, `✅ Project đã tạo thành công:\n🔗 ${link}`);
    } catch (err) {
      bot.sendMessage(chatId, `❌ Lỗi tạo project hoặc set biến môi trường:\n${err.response?.data?.error?.message || err.message}`);
    }

    delete userSteps[chatId];
  }
});
