// Sau khi import và khởi tạo bot, trong phần step === 2:

try {
  const headers = {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    "Content-Type": "application/json"
  };

  // 1. Tạo project (API v11)
  const createRes = await axios.post(
    "https://api.vercel.com/v11/projects",
    { name: projectName },
    { headers }
  );

  // 2. Thêm biến môi trường (có thể gửi nhiều env cùng lúc – API v11)
  //    Endpoint: POST /v11/projects/:projectId/env
  const projectId = createRes.data.id;
  await axios.post(
    `https://api.vercel.com/v11/projects/${projectId}/env`,
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
    { headers }
  );

  const link = `https://${createRes.data.name}.vercel.app`;
  bot.sendMessage(chatId, `✅ Project đã được tạo thành công!\n🔗 ${link}`);
} catch (err) {
  bot.sendMessage(
    chatId,
    `❌ Lỗi tạo project hoặc set biến môi trường:\n` +
    (err.response?.data?.error?.message || err.message)
  );
}
