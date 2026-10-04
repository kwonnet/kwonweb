"use client";
import { Alert, Snackbar } from "@mui/material";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Options = { key?: string; severity?: "info" | "success" | "warning" | "error"; autoHideDuration?: number | null };
type Notice = Options & { key: string; message: ReactNode };
type Notifications = { show: (message: ReactNode, options?: Options) => string; close: (key: string) => void };
const Context = createContext<Notifications | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Notice[]>([]);
  const sequence = useRef(0);
  const show = useCallback((message: ReactNode, options: Options = {}) => {
    const key = options.key ?? `notice-${++sequence.current}`;
    setQueue(current => current.some(item => item.key === key) ? current : [...current, { ...options, key, message }]);
    return key;
  }, []);
  const close = useCallback((key: string) => setQueue(current => current.filter(item => item.key !== key)), []);
  const value = useMemo(() => ({ show, close }), [show, close]);
  const notice = queue[0];
  return <Context.Provider value={value}>
    {children}
    {notice && <Snackbar key={notice.key} open autoHideDuration={notice.autoHideDuration === undefined ? 5000 : notice.autoHideDuration}
      onClose={(_, reason) => { if (reason !== "clickaway") close(notice.key); }}>
      <Alert severity={notice.severity ?? "info"} variant="filled" onClose={() => close(notice.key)}>{notice.message}</Alert>
    </Snackbar>}
  </Context.Provider>;
}

export function useNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error("useNotifications requires NotificationsProvider");
  return value;
}
