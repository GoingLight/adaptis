import { useEffect, useState } from "react";
import { ApiError } from "../api/client";
import { useT } from "../i18n";

export const Badge = ({ status }: { status: string }) => <span className={`badge ${status}`}>{status}</span>;

export function errText(e: unknown): string {
  if (e instanceof ApiError) {
    const d = e.data;
    if (typeof d === "string") return d.slice(0, 200);
    if (d?.detail) return d.detail;
    if (d && typeof d === "object") return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" · ");
  }
  return (e as Error)?.message || "Something went wrong";
}

/** Tiny async-state helper: const {data, loading, error, reload} = useLoad(() => fetchFn(), [deps]) */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fn().then((d) => alive && (setData(d), setError(null))).catch((e) => alive && setError(errText(e))).finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, loading, error, reload: () => setTick((t) => t + 1), setData };
}

export const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString() : "—");
export const fmtBytes = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n > 1e3 ? `${(n / 1e3).toFixed(0)} KB` : `${n} B`);

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const { t } = useT();
  return (
    <button className="btn secondary sm" onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>
      {ok ? t("copied") : t("copy")}
    </button>
  );
}
