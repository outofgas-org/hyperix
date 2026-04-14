import { useSyncExternalStore } from "react";
import { wsTransport } from "./config/hl.js";

export type ConnectionStatus = "online" | "offline";

function getStatus(): ConnectionStatus {
  return wsTransport.socket.readyState === wsTransport.socket.OPEN
    ? "online"
    : "offline";
}

function subscribe(onStoreChange: () => void) {
  const socket = wsTransport.socket;

  socket.addEventListener("open", onStoreChange);
  socket.addEventListener("close", onStoreChange);
  socket.addEventListener("error", onStoreChange);

  return () => {
    socket.removeEventListener("open", onStoreChange);
    socket.removeEventListener("close", onStoreChange);
    socket.removeEventListener("error", onStoreChange);
  };
}

export function useSubscribeStatus(): ConnectionStatus {
  return useSyncExternalStore(subscribe, getStatus, () => "offline");
}
