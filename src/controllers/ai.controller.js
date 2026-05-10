// src/controllers/ai.controller.js

const OpenAI = require("openai");

/* ======================================================
   ENV CHECK
====================================================== */

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "⚠️ OPENAI_API_KEY missing"
  );
}

/* ======================================================
   OPENAI CLIENT
====================================================== */

const openai =
  new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY,
  });

/* ======================================================
   GENERATE PRODUCT DESCRIPTION
====================================================== */

exports.generateDescription =
  async (req, res) => {
    try {

      const {
        name,
        category,
        features,
      } = req.body;

      /* ================= VALIDATION ================= */

      if (!name) {
        return res.status(400).json({
          message:
            "Product name required",
        });
      }

      if (!category) {
        return res.status(400).json({
          message:
            "Category required",
        });
      }

      /* ================= FEATURES CLEAN ================= */

      const cleanFeatures =
        Array.isArray(
          features
        )
          ? features.join(
              ", "
            )
          : features ||
            "No features provided";

      /* ================= PROMPT ================= */

      const prompt = `
You are an expert ecommerce copywriter.

Write a professional ecommerce product description.

Product Name:
${name}

Category:
${category}

Features:
${cleanFeatures}

Requirements:
- SEO friendly
- Human readable
- Engaging tone
- Short introduction
- 4-6 bullet points
- Add a small closing line
- Avoid fake claims
- Output clean markdown
`;

      /* ================= OPENAI ================= */

      const completion =
        await openai.chat.completions.create(
          {
            model:
              "gpt-4.1-mini",

            temperature:
              0.7,

            max_tokens:
              500,

            messages: [
              {
                role:
                  "system",

                content:
                  "You are a professional ecommerce copywriter.",
              },

              {
                role:
                  "user",

                content:
                  prompt,
              },
            ],
          }
        );

      const text =
        completion
          ?.choices?.[0]
          ?.message
          ?.content ||
        "Description generation failed";

      /* ================= RESPONSE ================= */

      return res.json({
        success: true,

        description:
          text,
      });

    } catch (err) {

      console.error(
        "AI DESCRIPTION ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "AI description generation failed",
      });
    }
  };