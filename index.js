require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Endpoint webhook dari Telegram
app.post("/webhook", async (req, res) => {
  const message = req.body.message;

  // Cek apakah ada pesan teks
  if (!message || !message.text) {
    return res.sendStatus(200); // Abaikan jika bukan pesan teks
  }

  const userMessage = message.text;
  const chatId = message.chat.id;

  try {
    // Kirim pesan ke VectorShift
    const vsResponse = await axios.post(
      "https://api.vectorshift.ai/api/chatbots/run",
      {
        input: userMessage,
        user_id: String(chatId), // bisa juga pakai message.from.id
        chatbot_id: process.env.VECTORSHIFT_CHATBOT_ID,
        is_twilio: true
      },
      {
        headers: {
          "Api-Key": process.env.VECTORSHIFT_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("VS response full:", JSON.stringify(vsResponse.data, null, 2));

    const reply = vsResponse.data.output || "Maaf, tidak ada balasan.";

    // Kirim balasan ke Telegram
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: reply,
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("Error saat memproses pesan:", err.response?.data || err.message);
    console.error("Detail error:", JSON.stringify(err.response?.data, null, 2));
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("Bot is running.");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});