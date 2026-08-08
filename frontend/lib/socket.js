import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false, transports: ["websocket", "polling"] });
  }
  return socket;
}
