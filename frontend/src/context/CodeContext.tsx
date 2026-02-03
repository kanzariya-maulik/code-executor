import React, { useEffect } from "react";
import { useFile } from "../services/files.service";
import { useFileContext } from "./FileContext";
import { useSocketContext } from "../hooks/useSocket";

interface ICodeContext {
  files: { name: string; path: string; content: string }[];
  setFiles: (files: { name: string; path: string; content: string }[]) => void;
  getFileCode: (name: string, path: string) => string | undefined;
  updateFileContent: (name: string, path: string, content: string) => void;
}

const CodeContext = React.createContext<ICodeContext | null>(null);

export const CodeProvider = ({ children }: { children: React.ReactNode }) => {
  const [files, setFiles] = React.useState<
    { name: string; path: string; content: string }[]
  >([]);
  const { socket } = useSocketContext();
  const { updateFile, getFileContent } = useFile();
  const { openFiles, currentOpenFile } = useFileContext();

  useEffect(() => {
    socket?.on("files:get-content", (data) => {
      console.log("data", data);
      setFiles((prev) => [...prev, data]);
    });

    return () => {
      socket?.off("files:get-content");
    };
  }, [socket]);

  useEffect(() => {
    if (currentOpenFile) {
      if (!files.find((file) => file.path === currentOpenFile.path)) {
        getFileContent(currentOpenFile.name, currentOpenFile.path);
      }
    }
    openFiles.forEach((file) => {
      if (!files.find((f) => f.path === file.path)) {
        getFileContent(file.name, file.path);
      }
    });
  }, [openFiles, currentOpenFile]);

  const updateFileContent = (name: string, path: string, content: string) => {
    setFiles((prev) =>
      prev.map((file) => (file.path === path ? { ...file, content } : file)),
    );
    updateFile({ name, path, content });
  };

  const getFileCode = (name: string, path: string) => {
    if (files.find((file) => file.path === path)) {
      return files.find((file) => file.path === path)?.content;
    } else {
      getFileContent(name, path);
    }
  };

  return (
    <CodeContext.Provider
      value={{ files, setFiles, getFileCode, updateFileContent }}
    >
      {children}
    </CodeContext.Provider>
  );
};

export const useCodeContext = () => {
  const context = React.useContext(CodeContext);
  if (!context) {
    throw new Error("useCodeContext must be used within a CodeProvider");
  }
  return context;
};
