import type { Socket } from "socket.io";
import type { Container } from "dockerode";
import { fileService } from "../service/file.service.js";

export const fileRegister = (socket: Socket, container: Container) => {
  socket.on("files:list", async () => {
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:create", async (d) => {
    await fileService.createFile(container, d.path, d.name);
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:create-folder", async (d) => {
    await fileService.createFolder(container, d.path, d.name);
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:delete", async (d) => {
    await fileService.deleteFile(container, d.path, d.name);
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:delete-folder", async (d) => {
    await fileService.deleteFolder(container, d.path, d.name);
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:update", async (d) => {
    await fileService.updateFile(container, d.path, d.name, d.content);
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:get-content", async (d) => {
    socket.emit(
      "files:get-content",
      await fileService.getFileContent(container, d.path, d.name),
    );
  });
};
