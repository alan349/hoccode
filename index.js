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
    bot.sendMessage(chatId, "Vui lòng nhập tên project bạn muốn tạo:");
    return;
  }

  const step = userSteps[chatId].step;

  if (step === 0) {
    userSteps[chatId].data.projectName = text;
    userSteps[chatId].step++;
    bot.sendMessage(chatId, "Vui lòng nhập Token:");
  } else if (step === 1) {
    userSteps[chatId].data.vercelToken = text;
    userSteps[chatId].step++;
    bot.sendMessage(chatId, "Vui lòng nhập Telegram Chat ID:");
  } else if (step === 2) {
    userSteps[chatId].data.chatId = text;
    const { projectName, vercelToken } = userSteps[chatId].data;

    try {
      const response = await axios.post(
        "https://api.vercel.com/v13/projects",
        {
          name: projectName,
          gitRepository: {
            type: "github",
            repo: process.env.GITHUB_REPO.replace("https://github.com/", "")
          }
        },
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      const link = `https://${projectName}.vercel.app`;
      bot.sendMessage(chatId, `✅ Dự án đã được tạo: ${link}`);
    } catch (err) {
      bot.sendMessage(chatId, `❌ Lỗi tạo dự án: ${err.response?.data?.error?.message || err.message}`);
    }

    delete userSteps[chatId];
  }
});
