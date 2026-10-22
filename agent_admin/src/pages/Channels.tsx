import { FormEvent, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { channels as api } from "../api/endpoints";
import type { Channel, ChannelType } from "../api/types";
import { CopyButton, errText, fmtDate, useLoad } from "../components/ui";
import { useT } from "../i18n";
import type { AgentCtx } from "./AgentLayout";

const TYPES: { type: ChannelType; label: string; color: string; glyph: string }[] = [
  { type: "telegram", label: "Telegram", color: "#2aabee", glyph: "✈" },
  { type: "instagram", label: "Instagram", color: "#d6336c", glyph: "◎" },
  { type: "facebook", label: "Facebook", color: "#1877f2", glyph: "f" },
];

export default function Channels() {
  const { agent } = useOutletContext<AgentCtx>();
  const { t } = useT();
  const list = useLoad(() => api.list(agent.id), [agent.id]);
  const rows = list.data?.results ?? [];
  return (
    <>
      <div className="page-head" style={{ marginBottom: 18 }}>
        <div><h2 style={{ marginBottom: 4 }}>{t("channelsTitle")}</h2><p className="muted">{t("channelsSub")}</p></div>
      </div>
      {!agent.is_ready && <p className="error" style={{ marginBottom: 14 }}>{t("channelNotTrained")}</p>}
      <div className="grid cols-3" style={{ alignItems: "start" }}>
        {TYPES.map((d) => <ChannelCard key={d.type} def={d} agentId={agent.id} existing={rows.find((r) => r.type === d.type)} onChange={list.reload} />)}
      </div>
    </>
  );
}

function ChannelCard({ def, agentId, existing, onChange }: { def: (typeof TYPES)[number]; agentId: number; existing?: Channel; onChange: () => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ username: "", bot_token: "", page_id: "", page_access_token: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isTg = def.type === "telegram";
  const status = existing?.status ?? "none";

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const payload: any = { type: def.type, username: f.username };
      if (isTg) payload.bot_token = f.bot_token; else { payload.page_id = f.page_id; payload.page_access_token = f.page_access_token; }
      const ch = existing ? await api.update(agentId, existing.id, payload) : await api.create(agentId, payload);
      const res = await api.connect(agentId, ch.id);
      if (res.status !== "connected") setErr(res.error || t("error"));
      setOpen(false); onChange();
    } catch (ex) { setErr(errText(ex)); } finally { setBusy(false); }
  }

  async function remove() {
    if (!existing || !confirm(`${t("disconnect")} ${def.label}?`)) return;
    await api.remove(agentId, existing.id); onChange();
  }

  return (
    <div className="card">
      <div className="row-inline" style={{ justifyContent: "space-between" }}>
        <div className="row-inline">
          <span className="ch-glyph" style={{ background: def.color }}>{def.glyph}</span>
          <div><h3 style={{ margin: 0 }}>{def.label}</h3><span className="small muted">{existing?.username || "—"}</span></div>
        </div>
        <span className={`badge ${status === "connected" ? "live" : status === "error" ? "failed" : "neutral"}`}>
          {status === "connected" ? t("connected") : status === "error" ? t("error") : t("pending")}
        </span>
      </div>
      {existing?.error && <div className="error">{existing.error}</div>}
      {existing?.last_message_at && <p className="small muted" style={{ marginTop: 10 }}>{t("lastMessage")}: {fmtDate(existing.last_message_at)}</p>}

      {!open && (
        <div className="actions">
          <button className="btn sm" onClick={() => setOpen(true)}>{existing ? t("reconnect") : t("connect")}</button>
          {existing && <button className="btn danger sm" onClick={remove}>{t("disconnect")}</button>}
        </div>
      )}

      {open && (
        <form onSubmit={submit} style={{ marginTop: 6 }}>
          <p className="small muted" style={{ marginTop: 12 }}>{isTg ? t("tgHow") : t("metaHow")}</p>
          {isTg ? (
            <><label>{t("botToken")}</label><input value={f.bot_token} onChange={(e) => setF({ ...f, bot_token: e.target.value })} placeholder="123456789:AAH…" required={!existing} /></>
          ) : (
            <>
              <label>{t("pageId")}</label><input value={f.page_id} onChange={(e) => setF({ ...f, page_id: e.target.value })} placeholder="1234567890" required={!existing} />
              <label>{t("pageToken")}</label><input value={f.page_access_token} onChange={(e) => setF({ ...f, page_access_token: e.target.value })} placeholder="EAAG…" required={!existing} />
              <label>{t("usernameOpt")}</label><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="@safia.bakery" />
            </>
          )}
          {err && <div className="error">{err}</div>}
          <div className="actions"><button className="btn sm" disabled={busy}>{t("connect")}</button><button type="button" className="btn secondary sm" onClick={() => setOpen(false)}>{t("cancel")}</button></div>
        </form>
      )}

      {!isTg && existing && (
        <details style={{ marginTop: 14 }}>
          <summary className="small muted" style={{ cursor: "pointer" }}>{t("webhookUrl")}</summary>
          <pre className="snippet" style={{ marginTop: 8 }}>{existing.webhook_url}</pre>
          <div className="row-inline"><CopyButton text={existing.webhook_url} /><span className="small muted">{t("verifyToken")}: <code>META_VERIFY_TOKEN</code> (.env)</span></div>
        </details>
      )}
    </div>
  );
}
