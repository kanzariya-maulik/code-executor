import { createContext, useContext } from "react";
import { Socket } from "socket.io-client";

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isLoading: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isLoading: true,
});

export const useSocketContext = () => useContext(SocketContext);
