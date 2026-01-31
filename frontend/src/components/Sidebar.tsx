import { useSocketContext } from "../hooks/useSocket";
import { useEffect, useState } from "react";
import type { FileTree, FileTreeNode } from "../types";
import { useFile } from "../services/files.service";
import FileTreeView from "./ui/FileTree";

const Sidebar: React.FC = () => {
  const [files, setFiles] = useState<FileTree>({});
  const { socket } = useSocketContext();
  const { listFiles, createFile, createFolder } = useFile();
  const [selectedFolder, setSelectedFolder] = useState<FileTreeNode | "">("");

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

  return (
    <div className="flex h-full text-white select-none">
      {/* Activity Bar */}
      <div className="w-[48px] flex-shrink-0 flex flex-col items-center py-2 bg-[var(--vscode-activity-bar-bg)] border-r border-[#1e1e1e]">
        <div className="p-3 mb-2 cursor-pointer border-l-2 border-white opacity-100">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 9V3.5L18.5 9M6 2C4.89 2 4 2.89 4 4V20C4 21.1 5 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2H6Z"
              stroke="#cccccc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="p-3 mb-2 cursor-pointer border-l-2 border-transparent opacity-50 hover:opacity-100 transition-opacity">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#cccccc"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div className="p-3 mb-2 cursor-pointer border-l-2 border-transparent opacity-50 hover:opacity-100 transition-opacity">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#cccccc"
            strokeWidth="2"
          >
            <line x1="6" y1="3" x2="6" y2="15"></line>
            <circle cx="18" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <path d="M18 9a9 9 0 0 1-9 9"></path>
          </svg>
        </div>
      </div>

      {/* Explorer Side Bar */}
      <div className="w-64 flex flex-col bg-[var(--vscode-sidebar-bg)] border-r border-[var(--vscode-panel-border)]">
        {/* Header */}
        <div className="h-9 flex items-center px-4 text-[11px] font-bold tracking-wider text-[var(--vscode-text-muted)] uppercase cursor-default">
          Explorer
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between px-4 py-1 bg-[#37373d] text-white/90 text-[11px] font-bold uppercase cursor-pointer">
          <div className="flex items-center gap-1">
            <span className="text-[10px]">▼</span>
            <span>Project</span>
          </div>
          <div className="flex gap-2 opacity-100">
            <button
              title="New File"
              onClick={() =>
                createFile({
                  path: selectedFolder
                    ? typeof selectedFolder === "string"
                      ? ""
                      : selectedFolder.path
                    : "",
                  name: "file.txt",
                })
              }
              className="hover:scale-110 transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="#cccccc">
                <path d="M9 1v6h6v1H9v6H8V8H2V7h6V1h1z" />
              </svg>
            </button>
            <button
              title="New Folder"
              onClick={() =>
                createFolder({
                  path: selectedFolder
                    ? typeof selectedFolder === "string"
                      ? ""
                      : selectedFolder.path
                    : "",
                  name: "folder",
                })
              }
              className="hover:scale-110 transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="#cccccc">
                <path d="M7.5 5l-1-1H2v10h12V5H7.5zM2 4h4.5l1 1H14v10H2V4z" />
                <path d="M5.5 8h5v1h-5z" />
              </svg>
            </button>
            <button onClick={() => socket?.emit("files:list")} title="Refresh">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="#cccccc">
                <path d="M4.6 11.4L2.2 9H5v-.9H2.2l2.4-2.4-.6-.7-3.2 3.2 3.2 3.2 .6-.6zm7.4 3.2l.6.7 3.2-3.2-3.2-3.2-.6.7 2.4 2.4H11V13h3.4l-2.4 2.4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1">
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
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
