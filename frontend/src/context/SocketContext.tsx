import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Connect to backend websocket
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("WebSocket connected to backend");
      
      if (user) {
        newSocket.emit("join", user.id);
      }
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("WebSocket disconnected from backend");
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Re-emit join room when user changes
  useEffect(() => {
    if (socket && isConnected && user) {
      socket.emit("join", user.id);
    }
  }, [user, socket, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
