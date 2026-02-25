import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useSocketContext } from "../hooks/useSocket";
import { useTerminal } from "../services/terminal.service";
import {
  Plus,
  X,
  Trash2,
  SplitSquareHorizontal,
  ChevronUp,
} from "lucide-react";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const [terminalIds, setTerminalIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const addTerminal = () => {
    const id = crypto.randomUUID();
    if (createTerminal) createTerminal({ id });
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
          background: "#1e1e1e",
          foreground: "#cccccc",
          cursor: "#ffffff",
          selectionBackground: "#264f78",
          black: "#000000",
          red: "#cd3131",
          green: "#0dbc79",
          yellow: "#e5e510",
          blue: "#2472c8",
          magenta: "#bc3fbc",
          cyan: "#11a8cd",
          white: "#e5e5e5",
          brightBlack: "#666666",
          brightRed: "#f14c4c",
          brightGreen: "#23d18b",
          brightYellow: "#f5f543",
          brightBlue: "#3b8eea",
          brightMagenta: "#d670d6",
          brightCyan: "#29b8db",
          brightWhite: "#e5e5e5",
        },
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(wrapper);

      term.onData((data) => {
        if (writeCommand) writeCommand({ id, command: data });
      });

      terminalsRef.current.set(id, { id, term, fit, wrapper });
      setTerminalIds((prev) => [...prev, id]);
      setActiveId(id);

      socket.on(`output-${id}`, (data: string) => {
        terminalsRef.current.get(id)?.term.write(data);
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    });

    return () => {
      socket.off("terminal:create");
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
        if (closeTerminal) closeTerminal({ id });
        term.dispose();
      });
      terminalsRef.current.clear();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-t border-[#2b2b2b]">
      <div className="flex items-center px-0 bg-[#1e1e1e] border-b border-[#2b2b2b] select-none">
        <div className="flex items-center uppercase tracking-wide text-[11px] font-medium">
          <div className="px-4 py-1.5 text-white border-b hover:text-white cursor-pointer border-white">
            TERMINALS
          </div>
        </div>

        <div className="flex items-center ml-4 gap-2 border-l border-[#2b2b2b] pl-2">
          {terminalIds.map((id) => (
            <div
              key={id}
              onClick={() => setActiveId(id)}
              className={`
                flex items-center gap-2 px-3 py-1 rounded-sm text-xs transition-colors cursor-pointer border border-transparent
                ${
                  activeId === id
                    ? "bg-[#3c3c3c] text-white shadow-sm border-[#444444]"
                    : "text-[#858585] hover:bg-[#2a2d2e] hover:text-[#cccccc]"
                }
              `}
            >
              <span className="truncate max-w-[80px]">bash</span>
              {terminalIds.length > 1 && (
                <button
                  className="text-[#858585] hover:text-white p-0.5 rounded hover:bg-[#4a4d4e] transition-colors flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTerminal({ id });
                    setActiveId(null);
                    setTerminalIds((prev) => prev.filter((t) => t !== id));
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addTerminal}
            className="flex items-center justify-center p-1 rounded-sm text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c] transition-colors"
            title="New Terminal"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="ml-auto flex items-center pr-4 gap-3 text-[#858585]">
          <button
            className="hover:text-[#cccccc] transition-colors"
            title="Split Terminal"
          >
            <SplitSquareHorizontal size={14} />
          </button>
          <button
            className="hover:text-[#cccccc] transition-colors"
            title="Kill Terminal"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="hover:text-[#cccccc] transition-colors"
            title="Maximize Panel"
          >
            <ChevronUp size={14} />
          </button>
        </div>
      </div>

      {terminalIds.length === 0 && (
        <div className="flex items-center justify-center h-full w-full bg-[#1e1e1e] ">
          No terminals available
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 relative bg-[#1e1e1e] p-2 pl-4 h-full overflow-y-auto scroll-m-0"
      />
      <div ref={scrollRef}></div>
    </div>
  );
}
