import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const router = express.Router();

// Initialize Gemini 2.5
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/generate-bio", async (req, res) => {
  const { firstName, skills } = req.body;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // ✅ NEW MODEL
    });

    const prompt = `
      Create a short, clean, recruiter-friendly developer bio.
      Name: ${firstName}
      Skills: ${skills}
      Tone: confident, modern, technical.
      Limit to 35–40 words.
    `;

    const result = await model.generateContent(prompt);
    const bio = result.response.text();

    res.json({
      bio: bio || "Developer passionate about building modern apps.",
    });
  } catch (err) {
    console.error("Gemini 2.5 Error:", err);
    res.status(500).json({
      error: "Failed to generate AI bio",
      details: err.message,
    });
  }
});

router.post("/suggest-skills", async (req, res) => {
  const { skills } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Based on these skills: ${skills},
      suggest 5 related or missing skills developers commonly have.
      Return ONLY a comma-separated list. No sentences.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const suggestions = text
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    res.json({ suggestions });
  } catch (err) {
    console.error("Skill Suggest Error:", err);
    res.json({ suggestions: [] });
  }
});


export default router;
