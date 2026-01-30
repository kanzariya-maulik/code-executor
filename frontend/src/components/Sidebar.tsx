import FileIcone from "../assets/FileIcone";
import FolderIcon from "../assets/FolderIcone";
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
    <div className="h-full w-64 bg-black border-r border-neutral-800 flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h1 className="text-sm font-medium tracking-wide uppercase text-neutral-300">
          Files
        </h1>

        <div className="flex gap-1">
          <button
            title="New File"
            onClick={() =>
              createFile({
                path: selectedFolder ? selectedFolder.path : "",
                name: "file.txt",
              })
            }
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <FileIcone />
          </button>

          <button
            title="New Folder"
            onClick={() =>
              createFolder({
                path: selectedFolder ? selectedFolder.path : "",
                name: "folder",
              })
            }
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <FolderIcon />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-neutral-800">
        <button
          onClick={() => socket?.emit("files:list")}
          className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition"
        >
          ⟳ Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-2">
        <FileTreeView
          tree={files}
          selectedPath={selectedFolder? selectedFolder.path: ""}
          onSelect={(node) => {
            if (node.type === "dir") {
              setSelectedFolder(node);
            }
          }}
        />
      </div>
    </div>
  );
};

export default Sidebar;
