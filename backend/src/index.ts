import express from "express";
import { spawn } from "child_process";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import http from "http";
import cors from "cors";
import Docker from "dockerode";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const manager = new Map<string, Docker.Container>();

io.on("connection", (socket: Socket) => {
  console.log("a user connected", socket.id);

  const container = spawn("docker", [
    "run",
    "-i",
    "--rm",
    "ubuntu",
    "/bin/bash",
  ]); 

  container.stdin.write("mkdir /app\n");
  container.stdin.write("cd /app\n");

  container.stdout.on("data", (data) => {
    socket.emit("output", { data: data.toString(), type: "stdout" });
  });

  container.stderr.on("data", (data) => {
    socket.emit("output", { data: data.toString(), type: "stderr" });
  });

  socket.on("getFiles", (id: string) => {
    container.stdin.write("ls\n");
  });

  socket.on("command", (command: string) => {
    container.stdin.write(command + "\n");
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    container.kill();
  });
});

spawn("docker", ["--version"]).on("close", (code) => {
  if (code !== 0) {
    console.error(
      "Docker CLI not found or failed to execute. Ensure Docker is installed in the container.",
    );
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
