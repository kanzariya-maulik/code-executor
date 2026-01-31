import { useRef, useEffect } from "react";
import { useSocketContext } from "../hooks/useSocket";

export const useTerminal = () => {
  const { socket } = useSocketContext();
  const socketRef = useRef(socket);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const createTerminal = ({ id }: { id: string }) => {
    if (!socketRef.current) return;
    console.log("CREATE TERMINAL", id);
    socketRef.current.emit("terminal:create", { id });
  };

  const closeTerminal = ({ id }: { id: string }) => {
    if (!socketRef.current) return;
    console.log("CLOSE TERMINAL", id);
    socketRef.current.emit("terminal:close", { id });
  };

  const writeCommand = ({ id, command }: { id: string; command: string }) => {
    if (!socketRef.current) return;
    console.log("WRITE COMMAND", id, command);
    socketRef.current.emit("terminal:command", { id, command });
  };

  return {
    createTerminal,
    closeTerminal,
    writeCommand,
  };
};
