import { useEffect, useState } from "react";
import { onToast } from "../lib/toast";
import "./Toaster.css";

export function Toaster() {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  useEffect(() => onToast(setMsg), []);
  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 5200);
    return () => window.clearTimeout(t);
  }, [msg]);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {msg && (
        <div className="toast" key={msg.id}>
          <span className="toast__dot" aria-hidden="true" />
          <p>{msg.text}</p>
          <button type="button" onClick={() => setMsg(null)} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
