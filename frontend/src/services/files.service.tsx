import { useSocketContext } from "../hooks/useSocket";

export const useFile = () => {
  const { socket } = useSocketContext();

  const listFiles = () => {
    socket?.emit("files:list");
  };

  const createFile = ({ path, name }: { path: string; name: string }) => {
    socket?.emit("files:create", { path, name });
  };

  const createFolder = ({ path, name }: { path: string; name: string }) => {
    socket?.emit("files:create-folder", { path, name });
  };

  const deleteFile = ({ path, name }: { path: string; name: string }) => {
    socket?.emit("files:delete", { path, name });
  };

  const deleteFolder = ({ path, name }: { path: string; name: string }) => {
    socket?.emit("files:delete-folder", { path, name });
  };

  const updateFile = ({
    path,
    name,
    content,
  }: {
    path: string;
    name: string;
    content: string;
  }) => {
    socket?.emit("files:update", { path, name, content });
  };

  const getFileContent = (name: string, path: string) => {
    socket?.emit("files:get-content", { name, path });
  };

  return {
    listFiles,
    createFile,
    createFolder,
    deleteFile,
    deleteFolder,
    updateFile,
    getFileContent,
  };
};
