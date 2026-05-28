import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext.jsx";

const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const userId = user?.id || user?._id;

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", { autoConnect: false });
    socketRef.current.connect();
    if (userId) {
      // Convert to string to ensure consistent matching with server
      const userIdString = typeof userId === 'string' ? userId : String(userId);
      socketRef.current.emit("register", userIdString);
    }
    return () => socketRef.current?.disconnect();
  }, [userId]);

  return socketRef;
};

export default useSocket;
