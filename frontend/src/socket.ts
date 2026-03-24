import { io, Socket } from "socket.io-client";

const SOCKET_URL = (import.meta as any).env.VITE_API_URL.replace("/api/v1", "");

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket"], 
});

socket.on("connect", () => console.log("✅ Socket Connected:", socket.id));
socket.on("disconnect", () => console.log("❌ Socket Disconnected"));
socket.on("connect_error", (err) => console.error("⚠️ Socket Error:", err.message));