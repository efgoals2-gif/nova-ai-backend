const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.log("WARNING: OPENAI_API_KEY is missing");
}

/* HOME / HEALTH CHECK */
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "NOVA AI Backend",
    version: "1.1.0",
    features: [
      "General AI",
      "Learning Assistant",
      "Research",
      "Coding",
      "Market Intelligence",
      "Blender Task Queue"
    ]
  });
});

/* EXTRACT AI TEXT */
function extractText(data) {
  if (data.output_text) {
    return data.output_text.trim();
  }

  let text = "";

  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (Array.isArray(item.content)) {
        for (const part of item.content) {
          if (part.text) {
            text += part.text;
          }
        }
      }
    }
  }

  return text.trim();
}

/* CALL OPENAI */
async function askAI(instructions, userText, useWeb = false, tokenLimit = 800) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in Render.");
  }

  const requestBody = {
    model: "gpt-5.6-luna",
    instructions: instructions,
    input: userText,
    max_output_tokens: tokenLimit
  };

  if (useWeb) {
    requestBody.tools = [
      {
        type: "web_search"
      }
    ];
  }

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenAI API error:", data);

    throw new Error(
      data.error?.message || "AI API request failed"
    );
  }

  const reply = extractText(data);

  if (!reply) {
    throw new Error("AI returned an empty response.");
  }

  return reply;
}

/* GENERAL CHAT */
app.post("/chat", async (req, res) => {
  try {
    const history = Array.isArray(req.body.history)
      ? req.body.history
      : [];

    const mode = req.body.mode || "general";

    if (history.length === 0) {
      return res.json({
        reply: "Hello! I am NOVA AI. How can I help you?"
      });
    }

    const recentHistory = history.slice(-8);

    const conversation = recentHistory
      .map(message => {
        const role =
          message.role === "assistant"
            ? "NOVA"
            : "User";

        return `${role}: ${message.content}`;
      })
      .join("\n\n");

    const instructions = `
You are NOVA AI, an intelligent and helpful AI assistant.

Current mode: ${mode}

Rules:
- Give accurate, useful answers.
- Be clear and practical.
- Explain difficult topics simply.
- Do not invent facts.
- Use headings or bullets when helpful.
- Do not claim to perform actions you did not perform.
- For financial questions, provide educational and risk-aware information.
- For coding, give working code.
- For learning, explain step by step.
- Keep normal answers concise unless more detail is needed.
- You are NOVA AI, not ChatGPT.

Conversation:
${conversation}
`;

    const reply = await askAI(
      instructions,
      "Answer the user's latest message.",
      false,
      800
    );

    res.json({ reply });

  } catch (error) {
    console.error("Chat error:", error.message);

    res.status(500).json({
      error: error.message
    });
  }
});

/* MARKET INTELLIGENCE */
app.post("/market-intelligence", async (req, res) => {
  try {
    const question = req.body.question || "";

    if (!question.trim()) {
      return res.status(400).json({
        error: "Please enter a market question."
      });
    }

    const marketInstructions = `
You are NOVA Market Intelligence, an evidence-based financial research assistant.

Use current web information when available.

Analyze only the most relevant information.

Required format:

MARKET OUTLOOK
Brief current situation.

PREDICTIVE SCENARIO
Possible outcome, not certainty.

BULLISH SCENARIO
Conditions that could support upward movement.

BEARISH SCENARIO
Conditions that could support downward movement.

KEY EVIDENCE
3 to 5 important evidence points.

RISK FACTORS
Main risks.

CONFIDENCE
Low, Medium, or High, with one short reason.

IMPORTANT:
- Keep the complete answer under 500 words.
- Be concise and avoid repetition.
- Never guarantee profit.
- Never claim certainty about future prices.
- Never tell users to blindly buy or sell.
- Clearly separate facts from interpretation.
- If live data is unavailable, say so honestly.
- This is educational research, not personalized financial advice.
`;

    const reply = await askAI(
      marketInstructions,
      question,
      true,
      700
    );

    res.json({
      reply,
      mode: "market-intelligence"
    });

  } catch (error) {
    console.error("Market error:", error.message);

    res.status(500).json({
      error: error.message
    });
  }
});

/* BLENDER TASK QUEUE */
const blenderTasks = [];

app.post("/blender-task", (req, res) => {
  const task = req.body.task;

  if (!task) {
    return res.status(400).json({
      error: "No Blender task provided."
    });
  }

  blenderTasks.push(task);

  res.json({
    success: true,
    message: "Blender task received and queued.",
    task
  });
});

app.get("/blender-task/next", (req, res) => {
  if (blenderTasks.length === 0) {
    return res.json({
      task: null
    });
  }

  const task = blenderTasks.shift();

  res.json({
    task
  });
});

/* ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Internal server error"
  });
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`NOVA AI Backend running on port ${PORT}`);
});
