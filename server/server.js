// ============================================================
// server.js — AI-Powered PPT Generator Backend
// Stack: Express, Gemini API, PptxGenJS
// ============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import PptxGenJS from "pptxgenjs";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors()); // Allow all origins (restrict in prod if needed)
app.use(express.json()); // Parse JSON request bodies

// ─── Gemini Client ───────────────────────────────────────────
// Make sure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Theme Config ────────────────────────────────────────────
// Defines background and text colors for Light/Dark themes
const THEMES = {
  light: {
    background: "FFFFFF",
    titleColor: "1A1A2E",
    bulletColor: "2D2D44",
    accentColor: "4F46E5", // Indigo
    fontTitle: "Calibri",
    fontBody: "Calibri",
  },
  dark: {
    background: "0F0F1A",
    titleColor: "E0E0FF",
    bulletColor: "C0C0D8",
    accentColor: "818CF8", // Lighter indigo for dark bg
    fontTitle: "Calibri",
    fontBody: "Calibri",
  },
};

// ─── Helper: Extract JSON from Gemini Response ───────────────
/**
 * Gemini sometimes wraps JSON in markdown code fences like ```json ... ```
 * This function safely extracts the raw JSON array from the response text.
 */
function extractJSON(text) {
  // Try to find a JSON array inside markdown fences first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  // Fallback: try to find a raw JSON array directly
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }
  // Last resort: return the raw text and let JSON.parse throw
  return text.trim();
}

// ─── Helper: Build PptxGenJS Presentation ────────────────────
/**
 * Builds a .pptx file from parsed slide data and streams it back.
 * @param {Array}  slides  - Array of { title, bullet_points } objects
 * @param {string} theme   - "light" | "dark"
 * @param {string} topic   - Used on the title/cover slide
 * @returns {Buffer}       - Binary buffer of the generated .pptx
 */
async function buildPresentation(slides, theme, topic) {
  const pptx = new PptxGenJS();
  const colors = THEMES[theme] || THEMES.light;

  // Set default slide dimensions (widescreen 16:9)
  pptx.layout = "LAYOUT_WIDE";

  // ── Cover Slide ──────────────────────────────────────────
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: colors.accentColor };

  coverSlide.addText(topic, {
    x: 0.5,
    y: 1.5,
    w: "90%",
    h: 2,
    fontSize: 40,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fontFace: colors.fontTitle,
  });

  coverSlide.addText("AI Generated Presentation", {
    x: 0.5,
    y: 3.8,
    w: "90%",
    h: 0.6,
    fontSize: 18,
    color: "E8E8FF",
    align: "center",
    italic: true,
    fontFace: colors.fontBody,
  });

  // ── Content Slides ───────────────────────────────────────
  slides.forEach((slideData, index) => {
    const slide = pptx.addSlide();

    // Set background color based on theme
    slide.background = { color: colors.background };

    // Slide number badge (top-right corner)
    slide.addText(`${index + 1}`, {
      x: 8.8,
      y: 0.1,
      w: 0.6,
      h: 0.5,
      fontSize: 12,
      color: colors.accentColor,
      bold: true,
      align: "center",
    });

    // Colored accent bar at the top
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.08,
      fill: { color: colors.accentColor },
      line: { color: colors.accentColor },
    });

    // Slide title
    slide.addText(slideData.title || `Slide ${index + 1}`, {
      x: 0.4,
      y: 0.25,
      w: "90%",
      h: 1.1,
      fontSize: 28,
      bold: true,
      color: colors.titleColor,
      fontFace: colors.fontTitle,
    });

    // Separator line under title
    slide.addShape(pptx.ShapeType.line, {
      x: 0.4,
      y: 1.3,
      w: 8.8,
      h: 0,
      line: { color: colors.accentColor, width: 1.5 },
    });

    // Bullet points
    const bullets = (slideData.bullet_points || []).map((point) => ({
      text: point,
      options: {
        bullet: { type: "bullet", indent: 15 },
        color: colors.bulletColor,
        fontSize: 16,
        breakLine: true,
      },
    }));

    if (bullets.length > 0) {
      slide.addText(bullets, {
        x: 0.5,
        y: 1.5,
        w: 8.8,
        h: 4.2,
        fontFace: colors.fontBody,
        paraSpaceAfter: 8,
        valign: "top",
      });
    }
  });

  // ── Return buffer ────────────────────────────────────────
  // writeFile('nodebuffer') returns a Buffer compatible with res.send()
  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return buffer;
}

// ─── POST /generate ──────────────────────────────────────────
/**
 * Main endpoint. Accepts { topic, numSlides, theme } and returns
 * a downloadable .pptx file.
 */
app.post("/generate", async (req, res) => {
  const { topic, numSlides = 5, theme = "light" } = req.body;

  // ── Input validation ─────────────────────────────────────
  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    return res.status(400).json({ error: "A valid topic is required." });
  }

  const slideCount = Math.min(Math.max(parseInt(numSlides, 10) || 5, 1), 20);
  const selectedTheme = theme === "dark" ? "dark" : "light";

  console.log(
    `\n[Generate] Topic: "${topic}" | Slides: ${slideCount} | Theme: ${selectedTheme}`
  );

  try {
    // ── 1. Build Gemini Prompt ──────────────────────────────
    const prompt = `
You are an expert presentation creator. Generate a ${slideCount}-slide presentation on the topic: "${topic}".

Return ONLY a valid JSON array (no extra text, no markdown, no explanation).
The JSON must follow this exact structure:

[
  {
    "title": "Slide title here",
    "bullet_points": [
      "First key point",
      "Second key point",
      "Third key point"
    ]
  }
]

Rules:
- Generate exactly ${slideCount} slide objects.
- Each slide must have a "title" (string) and "bullet_points" (array of 3–5 strings).
- Keep bullet points concise, informative, and professional.
- Do NOT include a cover slide — start from the first content slide.
- Output ONLY the JSON array. No other text.
`.trim();

    // ── 2. Call Gemini API (with model fallback) ────────────
    // Try models in order — some keys may not have access to all models
    const MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
    let responseText = null;

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`[Gemini] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        console.log(`[Gemini] ✅ Success with model: ${modelName}`);
        break; // Stop trying once one succeeds
      } catch (modelErr) {
        console.warn(`[Gemini] ❌ Model "${modelName}" failed: ${modelErr.message}`);
        if (modelName === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) {
          throw new Error(`All Gemini models failed. Last error: ${modelErr.message}`);
        }
      }
    }

    console.log("[Gemini] Raw response received.");

    // ── 3. Parse JSON Safely ──────────────────────────────
    let slides;
    try {
      const jsonString = extractJSON(responseText);
      slides = JSON.parse(jsonString);

      // Validate structure
      if (!Array.isArray(slides)) throw new Error("Response is not an array.");
      slides = slides.filter(
        (s) => s && typeof s.title === "string" && Array.isArray(s.bullet_points)
      );
      if (slides.length === 0) throw new Error("No valid slides in response.");
    } catch (parseErr) {
      console.error("[Parse Error]", parseErr.message);
      console.error("[Raw Gemini Text]", responseText);
      return res.status(500).json({
        error:
          "Failed to parse Gemini response as valid JSON. Please try again.",
        details: parseErr.message,
      });
    }

    console.log(`[Parse] Successfully parsed ${slides.length} slides.`);

    // ── 4. Build PPT ─────────────────────────────────────
    const pptBuffer = await buildPresentation(slides, selectedTheme, topic);
    console.log("[PPT] Presentation built successfully.");

    // ── 5. Send as Downloadable File ──────────────────────
    const safeFilename = topic.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}_presentation.pptx"`);
    res.send(pptBuffer);
  } catch (err) {
    // Log the full error for debugging in the server terminal
    console.error("\n[Server Error] ========================================");
    console.error("[Server Error] Message:", err.message);
    if (err.status) console.error("[Server Error] HTTP Status:", err.status);
    if (err.statusText) console.error("[Server Error] Status Text:", err.statusText);
    if (err.errorDetails) console.error("[Server Error] Details:", JSON.stringify(err.errorDetails, null, 2));
    console.error("[Server Error] ========================================\n");

    res.status(500).json({
      error: "Internal server error. Please check your API key and try again.",
      details: err.message,
    });
  }
});

// ─── Health Check ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Generate PPT: POST http://localhost:${PORT}/generate\n`);
});
