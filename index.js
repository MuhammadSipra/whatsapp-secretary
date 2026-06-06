const __dirname_fix = require('path').resolve();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const SYSTEM_PROMPT = "You are a helpful WhatsApp secretary for a business. You will be given business information. Answer customer questions politely based on that business information. Reply in the same language the customer uses - like Hindi, English & etc.";

app.use(express.json());
app.use(express.static("C:\\Users\\ADMIN\\Downloads\\whatsapp-secretary"));
app.get("/dashboard", (req, res) => {
    res.sendFile("C:\\Users\\ADMIN\\Downloads\\whatsapp-secretary\\dashboard.html");
});

app.get("/", (req, res) => {
  res.send("WhatsApp Secretary is running!");
});

app.post("/webhook", async (req, res) => {
  const { message, businessInfo } = req.body;
  console.log("Incoming webhook:", req.body);
  if (!message) return res.status(400).json({ error: "message is required" });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
  try {
    const groqResponse = await axios.post(GROQ_API_URL, {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Business information:\n${businessInfo || "No business information provided."}\n\nCustomer message:\n${message}` },
      ],
      temperature: 0.7,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const aiReply = groqResponse.data.choices?.[0]?.message?.content?.trim() || "Sorry, I could not generate a reply.";
    console.log("AI reply:", aiReply);
    res.status(200).json({ status: "received", reply: aiReply });
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data || err.message;
    console.error("Groq API error:", detail);
    res.status(status).json({ error: "Failed to get AI response", detail });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});