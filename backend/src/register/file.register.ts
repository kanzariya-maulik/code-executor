import type { Socket } from "socket.io";
import type { Container } from "dockerode";
import { fileService } from "../service/file.service.js";

export const fileRegister = (socket: Socket, container: Container) => {
  socket.on("files:list", async () => {
    try {
      socket.emit("files:list", await fileService.getTree(container));
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
  });

  socket.on("files:create", async (d) => {
    try {
      await fileService.createFile(container, d.path, d.name);
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:create-folder", async (d) => {
    try {
      await fileService.createFolder(container, d.path, d.name);
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:delete", async (d) => {
    try {
      await fileService.deleteFile(container, d.path, d.name);
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:delete-folder", async (d) => {
    try {
      await fileService.deleteFolder(container, d.path, d.name);
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
    socket.emit("files:list", await fileService.getTree(container));
  });

  socket.on("files:update", async (d) => {
    try {
      await fileService.updateFile(container, d.path, d.name, d.content);
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
  });

  socket.on("files:get-content", async (d) => {
    try {
      socket.emit("files:get-content", {
        name: d.name,
        path: d.path,
        content: await fileService.getFileContent(container, d.path, d.name),
      });
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
  });

  socket.on("files:get-content", async (d) => {
    try {
      socket.emit("files:get-content", {
        name: d.name,
        path: d.path,
        content: await fileService.getFileContent(container, d.path, d.name),
      });
    } catch (error) {
      console.log(error);
      throw new Error((error as Error).message);
    }
  });
};
