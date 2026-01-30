import type { Socket } from "socket.io";
import type { Container } from "dockerode";
import { terminalService, type Terminal } from "../service/terminal.service.js";
import { commandService } from "../service/command.service.js";

const terminals = new Map<string, Terminal>();

export const terminalRegister = (socket: Socket, container: Container) => {
  socket.on("terminal:create", async ({ id }) => {
    const terminal = await terminalService.create(container, id);
    terminals.set(id, terminal);

    terminal.stream.on("data", (data) => {
      socket.emit(`output-${id}`, data.toString());
    });

    socket.emit("terminal:create", id);
  });

  socket.on("terminal:close", ({ id }) => {
    const t = terminals.get(id);
    if (!t) return;
    terminalService.close(t);
    terminals.delete(id);
  });

  socket.on("command", ({ id, command }) => {
    const t = terminals.get(id);
    if (!t) return;

    commandService.executeCommand(t.stream, command);
  });

  socket.on("disconnect", () => {
    terminals.forEach((t) => terminalService.close(t));
    terminals.clear();
  });
};
