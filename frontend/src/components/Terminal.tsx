import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useSocketContext } from "../hooks/useSocket";
import { useTerminal } from "../services/terminal.service";

interface TermInstance {
  id: string;
  term: Terminal;
  fit: FitAddon;
  wrapper: HTMLDivElement;
}

export default function TerminalPanel() {
  const { socket } = useSocketContext();
  const { createTerminal, writeCommand, closeTerminal } = useTerminal();

  const containerRef = useRef<HTMLDivElement>(null);
  const terminalsRef = useRef<Map<string, TermInstance>>(new Map());

  const [terminalIds, setTerminalIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const addTerminal = () => {
    const id = crypto.randomUUID();
    createTerminal({ id });
  };

  useEffect(() => {
    if (!socket || !containerRef.current) return;

    socket.on("terminal:create", ({ id }: { id: string }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "h-full w-full";
      wrapper.style.display = "none";
      containerRef.current!.appendChild(wrapper);

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        convertEol: true,
        fontFamily: '"JetBrains Mono", monospace',
        theme: {
          background: "#0f172a",
          foreground: "#f8fafc",
          cursor: "#38bdf8",
          selectionBackground: "#334155",
        },
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(wrapper);

      term.onData((data) => {
        writeCommand({ id, command: data });
      });

      terminalsRef.current.set(id, { id, term, fit, wrapper });
      setTerminalIds((prev) => [...prev, id]);
      setActiveId(id);
    });

    socket.on(`output-${id}`, (data: string) => {
      terminalsRef.current.get(id)?.term.write(data);
    });

    return () => {
      socket.off("terminal:create");
      socket.off(`output-${id}`);
    };
  }, [socket]);

  useEffect(() => {
    terminalsRef.current.forEach(({ wrapper, fit }, id) => {
      const active = id === activeId;
      wrapper.style.display = active ? "block" : "none";

      if (active) {
        requestAnimationFrame(() => fit.fit());
      }
    });
  }, [activeId]);

  useEffect(() => {
    return () => {
      terminalsRef.current.forEach(({ id, term }) => {
        closeTerminal({ id });
        term.dispose();
      });
      terminalsRef.current.clear();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-t border-slate-800">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 border-b border-slate-700">
        {terminalIds.map((id, idx) => (
          <button
            key={id}
            onClick={() => setActiveId(id)}
            className={`
              px-3 py-1 text-xs rounded
              ${
                activeId === id
                  ? "bg-slate-900 text-white"
                  : "text-slate-400 hover:text-white"
              }
            `}
          >
            Terminal {idx + 1}
          </button>
        ))}

        <button
          onClick={addTerminal}
          className="ml-auto px-2 text-slate-400 hover:text-white"
        >
          +
        </button>
      </div>

      {/* Terminal area */}
      <div ref={containerRef} className="flex-1 relative" />
    </div>
  );
}
