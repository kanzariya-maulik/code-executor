import express from "express";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import http from "http";
import cors from "cors";
import { containerService } from "./service/container.service.js";
import { fileRegister } from "./register/file.register.js";
import { terminalRegister } from "./register/terminal.register.js";
import { proxyMiddleware } from "./proxy/proxy.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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
