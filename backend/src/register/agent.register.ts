import type { Socket } from "socket.io";
import type { Container } from "dockerode";
import { fileService } from "../service/file.service.js";
import { Duplex } from "stream";

const OLLAMA_HOST = "https://ollama.com";
const OLLAMA_API_KEY =
  process.env.OLLAMA_API_KEY ||
  "7a3e4f7f2c404a379576ed7da56d7dff.BTf1x2CDlY1WgMEBeXBuxC8m";

const tools = [
  {
    type: "function",
    function: {
      name: "list_files",
      description:
        "List the entire file tree of the user's project. Returns a nested JSON object with all files and directories.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description:
        "Read the contents of a file. Use the path relative to the project root (e.g. 'index.js' or 'src/app.ts').",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "File path relative to project root, e.g. 'index.js' or 'src/utils/helper.ts'",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Create or overwrite a file with the given content. Parent directories will be created automatically. Use this to create new files or edit existing ones.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "File path relative to project root",
          },
          content: {
            type: "string",
            description: "The full content to write to the file",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_folder",
      description: "Create a directory (and any parent directories).",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Folder path relative to project root, e.g. 'src/components'",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description:
        "Execute a shell command in the user's sandbox terminal. Returns stdout and stderr. Use this to install packages, run scripts, start servers, etc.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description:
              "The shell command to execute, e.g. 'npm install express'",
          },
        },
        required: ["command"],
      },
    },
  },
];

function splitPath(fullPath: string): { dir: string; name: string } {
  const parts = fullPath.replace(/^\/+/, "").split("/");
  const name = parts.pop() || "";
  const dir = parts.join("/");
  return { dir, name };
}

async function execCommand(
  container: Container,
  command: string,
  timeoutMs: number = 10000,
): Promise<string> {
  const exec = await container.exec({
    Cmd: ["bash", "-c", command],
    User: "sandbox",
    WorkingDir: "/sandbox",
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
  });

  const stream = (await exec.start({ hijack: true })) as Duplex;

  let stdout = "";
  let stderr = "";

  container.modem.demuxStream(
    stream,
    { write: (c: Buffer) => (stdout += c.toString()) },
    { write: (c: Buffer) => (stderr += c.toString()) },
  );

  const finished = await Promise.race([
    new Promise<boolean>((res) => stream.on("end", () => res(true))),
    new Promise<boolean>((res) => setTimeout(() => res(false), timeoutMs)),
  ]);

  if (!finished) {
    const partial = (stdout + (stderr ? `\nSTDERR: ${stderr}` : "")).trim();
    return (
      (partial || "(no output yet)") +
      "\n\n[Process still running in background]"
    );
  }

  if (stderr && !stdout) return `ERROR: ${stderr.trim()}`;
  return (stdout + (stderr ? `\nSTDERR: ${stderr}` : "")).trim();
}

async function executeTool(
  container: Container,
  socket: Socket,
  name: string,
  args: any,
): Promise<string> {
  try {
    switch (name) {
      case "list_files": {
        const tree = await fileService.getTree(container);
        return JSON.stringify(tree, null, 2);
      }
      case "read_file": {
        const { dir, name: fileName } = splitPath(args.path);
        const content = await fileService.getFileContent(
          container,
          dir ? `${dir}/${fileName}` : fileName,
          fileName,
        );
        return content;
      }
      case "write_file": {
        const { dir, name: fileName } = splitPath(args.path);
        if (dir) {
          await execCommand(container, `mkdir -p /sandbox/${dir}`);
        }
        await fileService.updateFile(
          container,
          args.path,
          fileName,
          args.content,
        );
        socket.emit("files:get-content", {
          name: fileName,
          path: args.path,
          content: args.content,
        });
        socket.emit("files:list", await fileService.getTree(container));
        return `File '${args.path}' written successfully.`;
      }
      case "create_folder": {
        const { dir, name: folderName } = splitPath(args.path);
        await fileService.createFolder(container, dir, folderName);
        return `Folder '${args.path}' created.`;
      }
      case "run_command": {
        const output = await execCommand(container, args.command);
        return output || "(no output)";
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `Error: ${err.message || err}`;
  }
}

export const agentRegister = (socket: Socket, container: Container) => {
  socket.on(
    "agent:chat",
    async (data: { messages: any[]; modelName?: string }) => {
      const { modelName } = data;
      const model = modelName || "qwen3-coder:480b";
      const MAX_ITERATIONS = 15;

      let messages = [
        {
          role: "system",
          content: `You are an expert coding agent embedded inside a cloud IDE. You have access to tools that let you directly create files, edit files, read files, create folders, and run shell commands in the user's project.

RULES:
1. When the user asks you to create, edit, or modify code — USE YOUR TOOLS. Do not tell the user what to do; DO IT yourself.
2. Always read existing files first before editing them so you don't lose content.
3. When writing files, always write the COMPLETE file content.
4. After making changes, briefly explain what you did.
5. Keep responses concise.
6. You can chain multiple tool calls to accomplish complex tasks.
7. When starting a server or long-running process, run it in the background using & (e.g. "node server.js &"). This prevents hanging.
8. After testing a server, ALWAYS kill it using "kill %1" or "pkill -f <process>" so it doesn't keep running.
9. When running npm install or other package managers, wait for them to complete before proceeding.`,
        },
        ...data.messages,
      ];

      try {
        for (let i = 0; i < MAX_ITERATIONS; i++) {
          const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OLLAMA_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              stream: false,
              messages,
              tools,
            }),
          });

          if (!response.ok) {
            socket.emit("agent:error", {
              error: `Ollama returned ${response.status}`,
            });
            socket.emit("agent:done");
            return;
          }

          const result: any = await response.json();
          const msg = result.message;

          if (!msg) {
            socket.emit("agent:error", { error: "Empty response from model" });
            socket.emit("agent:done");
            return;
          }

          messages.push(msg);

          if (msg.tool_calls && msg.tool_calls.length > 0) {
            for (const toolCall of msg.tool_calls) {
              const toolName = toolCall.function.name;
              const toolArgs = toolCall.function.arguments;
              socket.emit("agent:action", {
                name: toolName,
                args: toolArgs,
                status: "running",
              });

              const toolResult = await executeTool(
                container,
                socket,
                toolName,
                toolArgs,
              );

              socket.emit("agent:action", {
                name: toolName,
                args: toolArgs,
                status: "done",
                result:
                  toolResult.length > 500
                    ? toolResult.slice(0, 500) + "… (truncated)"
                    : toolResult,
              });
              messages.push({
                role: "tool",
                content: toolResult,
              });
            }
            continue;
          }
          if (msg.content) {
            socket.emit("agent:token", { token: msg.content, done: true });
          }

          break;
        }
      } catch (err: any) {
        console.error("Agent error:", err);
        socket.emit("agent:error", { error: err.message || "Agent error" });
      } finally {
        try {
          socket.emit("files:list", await fileService.getTree(container));
        } catch {}
        socket.emit("agent:done");
      }
    },
  );
};
