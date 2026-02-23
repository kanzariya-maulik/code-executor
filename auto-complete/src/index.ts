import express, { type Request, type Response } from "express";
import cors from "cors";

const app = express();
const PORT = 3002;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
  }),
);
app.use(express.json());

app.post("/suggestions", async (req: Request, res: Response) => {
  try {
    const { currentCode } = req.body;

    if (!currentCode) {
      return res.status(400).json({ error: "currentCode is required" });
    }

    const response = await fetch("http://ollama:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5:3b",
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 60,
          top_p: 0.9,
        },
        messages: [
          {
            role: "system",
            content: `
You are a high-precision inline code completion engine operating inside a live code editor.

The user input is the file content EXACTLY up to the cursor position.
The cursor is at the end of the provided text.

Your objective:
Continue the code from the cursor position ONLY.

Strict rules (must follow exactly):

1. Output ONLY the new continuation text.
2. NEVER repeat any existing input.
3. NEVER rewrite or restate previous code.
4. NEVER explain anything.
5. NEVER include markdown, backticks, or formatting.
6. NEVER include comments unless they are syntactically required.
7. NEVER output the full structure if it is partially written.
8. Complete only the current logical construct (statement, expression, block, or parameter list).
9. Stop immediately after the construct is complete.
10. Do not add extra functions, imports, or unrelated logic.

Precision requirements:

- Respect indentation exactly as provided.
- Maintain the same coding style as the input.
- Close brackets, parentheses, and braces correctly.
- If inside a function, stay inside that function.
- If inside a loop or conditional, complete only that block.
- If the statement is already complete, return an empty response.
- Prefer minimal valid completion over verbose output.
- Prioritize syntactic correctness over creativity.

Your role is to behave like a deterministic autocomplete engine, not a chatbot.
Return only what should appear next at the cursor.
`,
          },
          {
            role: "user",
            content: currentCode,
          },
        ],
      }),
    });

    const data = await response.json();

    console.log(
      "----------------------------SUGEESTIONS GOT--------------------------------",
    );
    console.log(data);
    console.log(
      "----------------------------up to frontend now ---------------------------------",
    );

    res.json({
      suggestion: data.message?.content ?? "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
