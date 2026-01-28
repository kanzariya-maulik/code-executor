import { spawn } from "child_process";
import type { Request, Response } from "express";

const images: Record<string, string> = {
  python: "python:3.12-alpine",
  node: "node:20-alpine",
  gcc: "gcc:13",
};

const commands: Record<string, string[]> = {
  python: ["python3", "-"],
  node: ["node"],
  gcc: ["bash", "-c", "cat > main.c && gcc main.c -O2 -o main && ./main"],
};

export const execController = (req: Request, res: Response) => {
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required" });
  }

  const image = images[language];
  const cmd = commands[language];

  if (!image || !cmd) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  res.setHeader("Content-Type", "text/plain");

  const child = spawn("docker", [
    "run",
    "-i",
    "--rm",
    "--network",
    "none",
    "--memory",
    "128m",
    "--cpus",
    "0.5",
    "--pids-limit",
    "64",
    "--read-only",
    image,
    ...cmd,
  ]);

  child.stdin.write(code);
  child.stdin.end();

  child.stdout.on("data", (chunk) => res.write(chunk));
  child.stderr.on("data", (chunk) => res.write(chunk));

  child.on("close", (exitCode) => {
    res.end(`\n\nProcess exited with code ${exitCode}`);
  });

  child.on("error", (err) => {
    res.end(`\nError: ${err.message}`);
  });
};
