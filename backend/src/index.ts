import express from "express";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import http from "http";
import cors from "cors";
import { containerService } from "./service/container.service.js";
import { fileRegister } from "./register/file.register.js";
import { terminalRegister } from "./register/terminal.register.js";
import { agentRegister } from "./register/agent.register.js";

const app = express();
const PORT = 3000;

const OLLAMA_HOST = process.env.OLLAMA_HOST || "https://ollama.com";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";

app.use(cors());
app.use(express.json());

app.post("/suggestions", async (req, res) => {
  try {
    const { currentCode, codeAfter, modelName, language } = req.body;

    if (!currentCode) {
      return res.status(400).json({ error: "currentCode is required" });
    }
    const langComment = language ? `// language: ${language}\n` : "";
    const prefix = langComment + currentCode;

    let finalPrompt = prefix;
    if (codeAfter) {
      finalPrompt = `<|fim_prefix|>${prefix}<|fim_suffix|>${codeAfter}<|fim_middle|>`;
    }

    const requestBody: any = {
      model: modelName || "qwen3-coder:480b",
      stream: false,
      raw: true,
      options: {
        temperature: 0,
        num_predict: 60,
        top_p: 0.9,
        stop: ["\n\n\n", "```", "<|file_separator|>", "<|fim_pad|>"],
      },
      prompt: finalPrompt,
    };

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data: any = await response.json();
    const rawText = data?.response ?? "";
    const suggestionText = rawText
      .replace(/^```[a-z]*\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    res.json({ suggestion: suggestionText });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/list", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: "GET",
      headers: { Authorization: `Bearer ${OLLAMA_API_KEY}` },
    });
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const ipConnectionCounts = new Map<
  string,
  { count: number; firstConnectionTime: number }
>();
const RATE_LIMIT_WINDOW_MS = 30 * 1000;
const MAX_CONNECTIONS_PER_WINDOW = 5;

io.on("connection", async (socket: Socket) => {
  const clientIp = socket.handshake.address;
  const now = Date.now();

  let ipData = ipConnectionCounts.get(clientIp);
  if (!ipData || now - ipData.firstConnectionTime > RATE_LIMIT_WINDOW_MS) {
    ipData = { count: 1, firstConnectionTime: now };
  } else {
    ipData.count++;
  }

  ipConnectionCounts.set(clientIp, ipData);

  if (ipData.count > MAX_CONNECTIONS_PER_WINDOW) {
    console.warn(
      `[RATE LIMIT] Rejected connection from ${clientIp}. Too many requests.`,
    );
    socket.emit(
      "error",
      "Rate limit exceeded. Please wait 30 seconds before reconnecting.",
    );
    socket.disconnect(true);
    return;
  }

  console.log("a user connected", socket.id, "from IP:", clientIp);

  const container = await containerService.create();

  try {
    fileRegister(socket, container);
    terminalRegister(socket, container);
    agentRegister(socket, container);
  } catch (error) {
    socket.emit("error", error);
    console.log(error);
  }

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    containerService.remove(container);
  });
});

containerService
  .ping()
  .then(() => {
    console.log("Found docker running containers");
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
