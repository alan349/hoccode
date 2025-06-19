require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// Bot dùng polling
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Lưu trạng thái người dùng
let userSteps = {};

// ✅ Xử lý lệnh /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Reset bước cũ (nếu có)
  delete userSteps[chatId];

  // Khởi tạo trạng thái mới
  userSteps[chatId] = { step: 0, data: {} };

  bot.sendMessage(chatId, "📦 Nhập tên project Vercel bạn muốn tạo:");
});

// ✅ Xử lý từng tin nhắn người dùng
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Bỏ qua /start vì đã xử lý riêng
  if (text === "/start") return;

  // Nếu chưa có bước nào → bắt đầu lại
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
      const headers = {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        "Content-Type": "application/json"
      };

      // 1. Tạo project
      await axios.post(
        "https://api.vercel.com/v13/projects",
        {
          name: projectName,
          gitRepository: {
            type: "github",
            repo: "alan349/602ver3"
          }
        },
        { headers }
      );

      // 2. Gửi biến TELEGRAM_BOT_TOKEN
      await axios.post(
        `https://api.vercel.com/v9/projects/${projectName}/env`,
        {
          key: "TELEGRAM_BOT_TOKEN",
          value: envToken,
          target: ["production"]
        },
        { headers }
      );

      // 3. Gửi biến TELEGRAM_CHAT_ID
      await axios.post(
        `https://api.vercel.com/v9/projects/${projectName}/env`,
        {
          key: "TELEGRAM_CHAT_ID",
          value: envChatId,
          target: ["production"]
        },
        { headers }
      );

      const link = `https://${projectName}.vercel.app`;
      bot.sendMessage(chatId, `✅ Project đã được tạo thành công!\n🔗 ${link}`);
    } catch (err) {
      bot.sendMessage(chatId, `❌ Lỗi tạo project hoặc set biến môi trường:\n${err.response?.data?.error?.message || err.message}`);
    }

    // Xoá trạng thái sau khi xong
    delete userSteps[chatId];
  }
});
