import React from "react";

import type { FileNode } from "../types/index";

interface IFileContext {
  currentOpenFile: FileNode | null;
  setCurrentOpenFile: (file: FileNode | null) => void;
  openFiles: FileNode[];
  setOpenFiles: (files: (prev: FileNode[]) => FileNode[]) => void;
  closeFile: (path: string) => void;
}

const FileContext = React.createContext<IFileContext | null>(null);

export const FileProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentOpenFile, setCurrentOpenFile] = React.useState<FileNode | null>(
    null,
  );
  const [openFiles, setOpenFiles] = React.useState<FileNode[]>([]);

  const closeFile = (path: string) => {
    setOpenFiles((prev) => prev.filter((file) => file.path !== path));
  };

  return (
    <FileContext.Provider
      value={{ currentOpenFile, setCurrentOpenFile, openFiles, setOpenFiles, closeFile }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = React.useContext(FileContext);
  if (!context) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
};
