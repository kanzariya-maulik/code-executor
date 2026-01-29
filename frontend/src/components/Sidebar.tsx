import React, { useEffect, useState } from "react";
import { useSocketContext } from "../context/SocketContext";
import FileIcone from "../assets/FileIcone";
import FolderIcon from "../assets/FolderIcone";

const Sidebar: React.FC = () => {
  const { socket } = useSocketContext();
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    socket?.emit("getFiles");
    socket?.on("output", (data: any) => {
      setFiles(
        data.data.split("\n").filter((file: string) => file.trim() !== ""),
      );
    });
  }, [socket]);

  return (
    <div className="h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h1 className="text-slate-100 text-lg font-semibold">Files</h1>

        <div className="flex gap-2">
          <button
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="New File"
          >
            <FileIcone />
          </button>

          <button
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="New Folder"
          >
            <FolderIcon />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <button
          onClick={() => socket?.emit("getFiles")}
          className="w-full text-sm bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-md"
        >
          Refresh
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto px-2">
        {files.length === 0 ? (
          <p className="text-slate-500 text-sm px-2 mt-4">No files found</p>
        ) : (
          files.map((file) => (
            <div
              key={file}
              className="px-3 py-1.5 text-slate-200 text-sm rounded hover:bg-slate-800 cursor-pointer"
            >
              {file}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
