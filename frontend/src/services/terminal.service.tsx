import { useEffect, useState } from "react";
import { useSocketContext } from "../hooks/useSocket";

export const useTerminal = () => {
  const { socket } = useSocketContext();

  const createTerminal = ({ id }: { id: string }) => {
    socket?.emit("terminal:create", id);
  };

  const closeTerminal = ({ id }: { id: string }) => {
    socket?.emit("terminal:close", id);
  };

  return {
    createTerminal,
    closeTerminal,
  };
};

export const useTerminalOutput = (id: string) => {
  const { socket } = useSocketContext();

  const [output, setOutput] = useState<string>("");

  useEffect(() => {
    if (!socket || !id) return;

    socket.on(`output-${id}`, (data: string) => {
      setOutput((prev) => prev + data);
    });

    return () => {
      socket.off(`output-${id}`);
    };
  }, [socket, id]);

  return output;
};

export const useTerminalInput = (id: string) => {
  const { socket } = useSocketContext();

  const writeCommand = (command: string) => {
    socket?.emit("command", { id, command });
  };

  return writeCommand;
};