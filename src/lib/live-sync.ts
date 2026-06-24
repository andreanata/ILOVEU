// Lightweight cross-tab realtime sync for demo mode (no localStorage).
// Uses BroadcastChannel, so multiple browser tabs/devices on SAME origin see updates instantly.
// In real Firebase mode, Firestore onSnapshot handles this globally.

let channel: BroadcastChannel | null = null;
try {
  channel = new BroadcastChannel("andre-lulu-sync");
} catch {}

export function broadcast(table: string) {
  try { channel?.postMessage({ type: "andre_lulu_update", table, t: Date.now() }) } catch {}
}

export function onBroadcast(cb: (table: string) => void) {
  if (!channel) return () => {};
  const h = (e: MessageEvent) => {
    if (e.data?.type === "andre_lulu_update") cb(e.data.table);
  };
  channel.addEventListener("message", h);
  return () => channel?.removeEventListener("message", h);
}
