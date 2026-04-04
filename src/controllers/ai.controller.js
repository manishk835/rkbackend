const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.generateDescription = async (req, res) => {
  try {
    const { name, category, features } = req.body;

    const prompt = `
Write a high-quality ecommerce product description.

Product Name: ${name}
Category: ${category}
Features: ${features}

- Make it engaging
- Include bullet points
- SEO friendly
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content;

    res.json({ description: text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "AI failed" });
  }
};