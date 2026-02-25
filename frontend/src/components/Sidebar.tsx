import { useSocketContext } from "../hooks/useSocket";
import { useCallback, useEffect, useState } from "react";
import type { FileTree, FileTreeNode } from "../types";
import { useFile } from "../services/files.service";
import FileTreeView from "./ui/FileTree";
import ChatPanel from "./ui/ChatPanel";
import { useFileContext } from "../context/FileContext";
import { useSettings } from "../context/SettingsContext";
import {
  Files,
  Search,
  Settings,
  FilePlus,
  FolderPlus,
  RefreshCw,
  ChevronDown,
  MessageSquare,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const { fileTree: files, setFileTree: setFiles } = useFileContext();
  const { setIsSettingsOpen } = useSettings();
  const { socket } = useSocketContext();
  const { listFiles, createFile, createFolder } = useFile();
  const { setOpenFiles, setCurrentOpenFile } = useFileContext();
  const [activeView, setActiveView] = useState<"explorer" | "chat">("explorer");
  const [selectedFolder, setSelectedFolder] = useState<FileTreeNode | "">("");
  const [createType, setCreateType] = useState<"file" | "folder" | null>(null);

  const [takeName, setTakeName] = useState(false);
  const [fileNameInput, setFileNameInput] = useState("");

  useEffect(() => {
    if (!socket) return;

    listFiles();

    socket.on("error", (error: string) => {
      alert(error);
    });

    socket.on("files:list", (files: FileTree) => {
      setFiles(files);
    });

    return () => {
      socket.off("files:list");
      socket.off("error");
    };
  }, [socket]);

  useEffect(() => {
    console.log("files", files);
  }, [files]);

  const createFileHandler = useCallback(() => {
    createFile({
      path: selectedFolder
        ? typeof selectedFolder === "string"
          ? ""
          : selectedFolder.path
        : "",
      name: fileNameInput,
    });
  }, [fileNameInput, selectedFolder, createFile]);

  const createFolderHandler = useCallback(() => {
    createFolder({
      path: selectedFolder
        ? typeof selectedFolder === "string"
          ? ""
          : selectedFolder.path
        : "",
      name: fileNameInput,
    });
  }, [fileNameInput, selectedFolder, createFolder]);

  return (
    <div className="flex h-full text-[#cccccc] select-none bg-[#1e1e1e]">
      {/* Activity Bar (Leftmost thin strip) */}
      <div className="w-[48px] flex-shrink-0 flex flex-col items-center py-3 bg-[#333333] border-r border-[#2b2b2b] justify-between">
        <div className="flex flex-col w-full items-center gap-4">
          <div
            onClick={() => setActiveView("explorer")}
            className={`w-full flex justify-center py-2 cursor-pointer border-l-[3px] relative left-[1.5px] transition-colors ${
              activeView === "explorer"
                ? "border-white text-white"
                : "border-transparent text-[#858585] hover:text-white"
            }`}
          >
            <Files size={24} strokeWidth={1.5} />
          </div>
          <div
            onClick={() => setActiveView("chat")}
            className={`w-full flex justify-center py-2 cursor-pointer border-l-[3px] relative left-[1.5px] transition-colors ${
              activeView === "chat"
                ? "border-white text-white"
                : "border-transparent text-[#858585] hover:text-white"
            }`}
          >
            <MessageSquare size={22} strokeWidth={1.5} />
          </div>
          <div className="w-full flex justify-center py-2 cursor-pointer border-l-[3px] border-transparent text-[#858585] hover:text-white transition-colors relative left-[1.5px]">
            <Search size={22} strokeWidth={1.5} />
          </div>
        </div>
        <div
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex justify-center py-4 cursor-pointer text-[#858585] hover:text-white transition-colors"
        >
          <Settings size={22} strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col bg-[#252526] border-r border-[#2b2b2b] h-full overflow-hidden">
        <div
          className={activeView === "chat" ? "flex flex-col h-full" : "hidden"}
        >
          <ChatPanel />
        </div>
        <div
          className={
            activeView === "explorer" ? "flex flex-col h-full" : "hidden"
          }
        >
          <div className="h-9 flex items-center px-4 shrink-0 text-[11px] font-bold tracking-wider text-[#cccccc] uppercase cursor-default">
            Explorer
          </div>

          <div className="flex items-center justify-between px-2 py-1 bg-[#252526] hover:bg-[#2a2d2e] transition-colors text-white font-bold uppercase cursor-pointer group">
            <div className="flex items-center gap-1">
              <ChevronDown size={14} className="text-[#cccccc] opacity-80" />
              <span className="text-[11px] font-bold tracking-wide mt-px">
                Project
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                title="New File"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateType("file");
                  setTakeName(true);
                }}
                className="p-1 hover:bg-[#37373d] rounded text-[#cccccc] hover:text-white"
              >
                <FilePlus size={14} />
              </button>
              <button
                title="New Folder"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateType("folder");
                  setTakeName(true);
                }}
                className="p-1 hover:bg-[#37373d] rounded text-[#cccccc] hover:text-white"
              >
                <FolderPlus size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  socket?.emit("files:list");
                }}
                title="Refresh"
                className="p-1 hover:bg-[#37373d] rounded text-[#cccccc] hover:text-white"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1">
            {takeName && (
              <div className="px-4 py-1">
                <input
                  autoFocus
                  type="text"
                  placeholder={
                    createType === "file" ? "New File Name" : "New Folder Name"
                  }
                  value={fileNameInput}
                  onChange={(e) => setFileNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!fileNameInput.trim()) return;

                      if (createType === "file") {
                        createFileHandler();
                      } else if (createType === "folder") {
                        createFolderHandler();
                      }

                      setTakeName(false);
                      setCreateType(null);
                      setFileNameInput("");
                    }

                    if (e.key === "Escape") {
                      setTakeName(false);
                      setCreateType(null);
                      setFileNameInput("");
                    }
                  }}
                  className="w-full px-2 py-1 text-sm bg-[#3c3c3c] text-white border border-[#007acc] outline-none rounded"
                />
              </div>
            )}

            <FileTreeView
              tree={files}
              selectedPath={
                typeof selectedFolder === "string"
                  ? selectedFolder
                  : selectedFolder.path
              }
              onSelect={(node) => {
                if (node.type === "dir") {
                  setSelectedFolder(node);
                } else if (node.type == "file") {
                  setOpenFiles((prev) => {
                    if (prev.some((file) => file.path === node.path))
                      return prev;
                    return [...prev, node];
                  });
                  setCurrentOpenFile(node);
                } else {
                  setSelectedFolder("");
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
