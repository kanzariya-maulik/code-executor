import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useSocketContext } from "../context/SocketContext";

export default function TerminalComponent() {
  const { socket } = useSocketContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const bufferRef = useRef("");

  useEffect(() => {
    if (!containerRef.current || termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: "#0f172a", 
        foreground: "#e2e8f0", 
        cursor: "#38bdf8",
        selectionBackground: "rgba(56, 189, 248, 0.3)",
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      convertEol: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);

    term.open(containerRef.current);
    term.focus();

    setTimeout(() => fit.fit(), 0);

    term.writeln("\x1b[1;34mWelcome to ExecRunner Terminal\x1b[0m");
    term.writeln("Connected to backend...");
    term.write("\r\n$ ");

    term.onData((data) => {
      if (data === "\r") {
        if (bufferRef.current.trim()) {
          socket?.emit("command", bufferRef.current);
        }
        bufferRef.current = "";
        term.write("\r\n$ ");
      } else if (data === "\u007F") {
        if (bufferRef.current.length > 0) {
          bufferRef.current = bufferRef.current.slice(0, -1);
          term.write("\b \b");
        }
      } else {
        bufferRef.current += data;
        term.write(data);
      }
    });

    const handleOutput = (out: any) => {
      term.write("\r\n" + out.data + "\r\n$ ");
    };

    socket?.on("output", handleOutput);

    termRef.current = term;
    fitRef.current = fit;

    const handleResize = () => {
      fit.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      socket?.off("output", handleOutput);
      window.removeEventListener("resize", handleResize);
      term.dispose();
      termRef.current = null;
    };
  }, [socket]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0f172a",
        padding: "12px",
        boxSizing: "border-box",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
