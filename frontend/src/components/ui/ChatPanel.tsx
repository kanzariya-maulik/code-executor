import React, { useEffect, useRef, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useFileContext } from "../../context/FileContext";
import { useCodeContext } from "../../context/CodeContext";
import { useSocketContext } from "../../hooks/useSocket";
import {
  SendHorizonal,
  Trash2,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  Terminal,
  FileCode,
  FolderOpen,
  List,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface AgentAction {
  name: string;
  args: any;
  status: "running" | "done";
  result?: string;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  list_files: <List size={12} />,
  read_file: <FileCode size={12} />,
  write_file: <FileCode size={12} />,
  create_folder: <FolderOpen size={12} />,
  run_command: <Terminal size={12} />,
};

const TOOL_LABELS: Record<string, (args: any) => string> = {
  list_files: () => "Listing files…",
  read_file: (a) => `Reading ${a.path}`,
  write_file: (a) => `Writing ${a.path}`,
  create_folder: (a) => `Creating folder ${a.path}`,
  run_command: (a) => `Running: ${a.command}`,
};

function renderContent(text: string) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const bodyMatch = part.match(/^```[a-z]*\n?([\s\S]*?)```$/);
      const code = bodyMatch ? bodyMatch[1] : part.slice(3, -3);
      return (
        <pre
          key={i}
          className="bg-[#1e1e1e] border border-[#3c3c3c] rounded p-3 my-2 overflow-x-auto text-[#d4d4d4] text-xs font-mono whitespace-pre"
        >
          {code}
        </pre>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-[#2d2d2d] text-[#9cdcfe] px-1 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return (
      <span key={i}>
        {part.split("\n").map((line, j, arr) => (
          <React.Fragment key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    );
  });
}

function ActionCard({ action }: { action: AgentAction }) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[action.name]?.(action.args) ?? action.name;
  const icon = TOOL_ICONS[action.name] ?? <Bot size={12} />;

  return (
    <div
      className="border border-[#3c3c3c] rounded-md my-1 bg-[#2d2d2d] text-xs cursor-pointer"
      onClick={() => action.result && setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        {action.status === "running" ? (
          <Loader2 size={12} className="text-[#007acc] animate-spin" />
        ) : (
          <CheckCircle2 size={12} className="text-[#4ec9b0]" />
        )}
        <span className="text-[#9cdcfe]">{icon}</span>
        <span className="text-[#cccccc] truncate">{label}</span>
      </div>
      {expanded && action.result && (
        <pre className="px-2 pb-2 text-[10px] text-[#858585] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
          {action.result}
        </pre>
      )}
    </div>
  );
}

const ChatPanel: React.FC = () => {
  const { selectedModel } = useSettings();
  const { currentOpenFile } = useFileContext();
  const { getFileCode } = useCodeContext();
  const { socket } = useSocketContext();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your coding agent. I can create files, edit code, and run commands for you. Just tell me what you need!",
    },
  ]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, actions]);

  useEffect(() => {
    if (!socket) return;

    const onToken = ({ token }: { token: string; done: boolean }) => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          updated[updated.length - 1] = {
            ...last,
            content: last.content + token,
          };
        }
        return updated;
      });
    };

    const onAction = (action: AgentAction) => {
      setActions((prev) => {
        if (action.status === "done") {
          return prev.map((a) =>
            a.name === action.name &&
            JSON.stringify(a.args) === JSON.stringify(action.args) &&
            a.status === "running"
              ? action
              : a,
          );
        }
        return [...prev, action];
      });
    };

    const onDone = () => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });
      setIsLoading(false);
    };

    const onError = ({ error }: { error: string }) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${error}` },
      ]);
      setIsLoading(false);
    };

    socket.on("agent:token", onToken);
    socket.on("agent:action", onAction);
    socket.on("agent:done", onDone);
    socket.on("agent:error", onError);

    return () => {
      socket.off("agent:token", onToken);
      socket.off("agent:action", onAction);
      socket.off("agent:done", onDone);
      socket.off("agent:error", onError);
    };
  }, [socket]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !socket) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setActions([]);
    setInput("");
    setIsLoading(true);

    // Build context with current file if open
    let contextNote = "";
    if (currentOpenFile) {
      const code = getFileCode(currentOpenFile.name, currentOpenFile.path);
      if (code) {
        const lang = currentOpenFile.name.split(".").pop() ?? "code";
        contextNote = `\n\n[Currently open file: ${currentOpenFile.name}]\n\`\`\`${lang}\n${code}\n\`\`\``;
      }
    }

    const chatMessages = messages
      .filter((m) => !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }));

    chatMessages.push({ role: "user", content: trimmed + contextNote });

    socket.emit("agent:chat", {
      messages: chatMessages,
      modelName: selectedModel,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. How can I help you?",
      },
    ]);
    setActions([]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] select-none">
      <div className="flex items-center justify-between px-4 h-9 border-b border-[#2b2b2b] bg-[#252526] shrink-0">
        <div className="text-[11px] uppercase tracking-wider font-medium text-[#cccccc] flex items-center gap-2">
          <Bot size={13} className="text-[#007acc]" />
          AI AGENT
        </div>
        <button
          onClick={clearChat}
          title="Clear chat"
          className="text-[#858585] hover:text-white transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "assistant" ? "bg-[#007acc]" : "bg-[#3c3c3c]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot size={12} className="text-white" />
                ) : (
                  <User size={12} className="text-[#cccccc]" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#2d5a8e] text-white"
                    : "bg-[#252526] border border-[#3c3c3c] text-[#cccccc]"
                }`}
              >
                {renderContent(msg.content)}
                {msg.streaming && !msg.content && (
                  <Loader2 size={14} className="text-[#007acc] animate-spin" />
                )}
                {msg.streaming && msg.content && (
                  <span className="inline-block w-1.5 h-3.5 bg-[#007acc] ml-0.5 animate-pulse rounded-sm" />
                )}
              </div>
            </div>
            {/* Show actions after the assistant's streaming message */}
            {msg.role === "assistant" &&
              msg.streaming &&
              actions.length > 0 && (
                <div className="ml-8 mt-1">
                  {actions.map((action, j) => (
                    <ActionCard key={j} action={action} />
                  ))}
                </div>
              )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 pb-3 pt-2 border-t border-[#2b2b2b] shrink-0">
        {currentOpenFile && (
          <div className="text-[10px] text-[#858585] mb-1 truncate">
            Context:{" "}
            <span className="text-[#9cdcfe]">{currentOpenFile.name}</span>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to create files, write code, run commands…"
            className="flex-1 bg-[#3c3c3c] text-[#cccccc] text-sm rounded px-3 py-2 resize-none outline-none border border-transparent focus:border-[#007acc] transition-colors placeholder-[#6c6c6c] min-h-[36px] max-h-[120px] leading-snug"
            style={{ height: "36px" }}
          />
          <button
            onClick={send}
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 bg-[#007acc] hover:bg-[#0098ff] disabled:opacity-30 disabled:cursor-not-allowed rounded flex items-center justify-center transition-colors shrink-0"
            title="Send"
          >
            <SendHorizonal size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
