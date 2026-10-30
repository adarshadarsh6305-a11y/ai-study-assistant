
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = 5000;

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://ai-study-assistant-tinder3.vercel.app"
    ]
}));
app.use(express.json({ limit: "1mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("StudyMate AI backend is running!");
});

app.post("/api/ai", async (req, res) => {
  try {
    const { feature, prompt } = req.body;

    const allowedFeatures = [
      "chat",
      "summarize",
      "quiz",
      "explain",
      "recommend",
    ];

    if (!allowedFeatures.includes(feature)) {
      return res.status(400).json({ error: "Invalid study tool." });
    }

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Please enter some text." });
    }

    if (prompt.length > 12000) {
      return res.status(400).json({ error: "Please enter less text." });
    }

    const instructions = {
      chat: "Act as a helpful academic tutor. Answer the student's question accurately in clear, simple English. Use examples when useful.",
      summarize: "Summarize the student's notes into concise revision notes. Include key concepts and important points. Do not invent facts missing from the notes.",
      quiz: "Create 5 multiple-choice questions about the given topic. For each question, provide four options labelled A, B, C, D and identify the correct answer with a short explanation.",
      explain: "Explain the given academic concept in beginner-friendly English, step by step, with a simple example.",
     recommend: `Act as a personalized study coach for college students.

Based on the student's subjects, available study time, weak topics, goals, and quiz scores, provide:

1. Personalized recommendations identifying which topics to prioritize.
2. A practical 7-day study timetable in a clear table.
3. Daily study sessions that fit the student's available time.
4. Short breaks between study sessions.
5. Time for revision and practice questions.
6. A simple weekly goal.

Give extra attention to weak topics and low quiz scores. Use only information provided by the student. If important information is missing, make reasonable suggestions and clearly state your assumptions. Use simple English and practical advice.`,
    };

let response;

for (let attempt = 0; attempt < 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `${instructions[feature]}\n\nStudent input:\n${prompt}`,
    });

    break;
  } catch (error) {
    const isTemporaryError =
      error.status === 503 ||
      error.status === 429 ||
      error.status === 500;

    if (!isTemporaryError || attempt === 2) {
      throw error;
    }

    const delay = 1000 * 2 ** attempt;
    console.log(`Temporary AI error. Retrying in ${delay / 1000}s...`);

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

res.json({ answer: response.text });
    res.json({ answer: response.text });
  } catch (error) {
    console.error("Gemini API error:", error.message);
    res.status(500).json({
      error: "The AI request failed. Check your API key, model access, quota, and server terminal.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`StudyMate backend running at http://localhost:${PORT}`);
});

