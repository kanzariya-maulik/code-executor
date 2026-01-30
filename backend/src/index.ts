import express from "express";
import { spawn } from "child_process";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import http from "http";
import cors from "cors";
import { containerService } from "./service/container.service.js";
import { fileRegister } from "./register/file.register.js";
import { terminalRegister } from "./register/terminal.register.js";

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

io.on("connection", async (socket: Socket) => {
  console.log("a user connected", socket.id);

  const container = await containerService.create();

  fileRegister(socket, container);
  terminalRegister(socket, container);

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    containerService.remove(container);
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
