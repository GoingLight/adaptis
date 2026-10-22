import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { conversations } from "../api/endpoints";
import { fmtDate, useLoad } from "../components/ui";
import type { AgentCtx } from "./AgentLayout";
import { useT } from "../i18n";

export default function Conversations() {
  const { agent } = useOutletContext<AgentCtx>();
  const { t } = useT();
  const list = useLoad(() => conversations.list(agent.id), [agent.id]);
  const [sel, setSel] = useState<number | null>(null);
  const detail = useLoad(() => (sel ? conversations.get(agent.id, sel) : Promise.resolve(null)), [sel]);
  const rows = list.data?.results ?? [];

  return (
    <div className="grid cols-2" style={{ alignItems: "start" }}>
      <div className="card">
        <h2>{t("conversations")} <span className="count">{list.data?.count ?? 0}</span></h2>
        {rows.length === 0 && <div className="empty"><strong>{t("noConv")}</strong>{t("noConvSub")}</div>}
        {rows.length > 0 && (
          <table>
            <thead><tr><th>{t("lastMessage")}</th><th>{t("channel")}</th><th>{t("msgs")}</th><th>{t("when")}</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={`clickable ${sel === c.id ? "selected" : ""}`} onClick={() => setSel(c.id)}>
                  <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.last_message || "—"}</td>
                  <td><span className="kind">{c.channel}</span></td>
                  <td>{c.message_count}</td>
                  <td className="small muted">{fmtDate(c.last_message_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="card">
        <h2>{t("transcript")}</h2>
        {!sel && <div className="empty">{t("selectConv")}</div>}
        {detail.data && (
          <>
            <p className="small muted">{t("visitor")} {detail.data.visitor_id} · {detail.data.page_url || t("noPage")}</p>
            <div className="chat">
              {detail.data.messages?.map((m) => (
                <div key={m.id} className={`bubble ${m.role}`}>
                  {m.content}
                  {m.role === "assistant" && m.latency_ms != null && <div className="small" style={{ opacity: .6, marginTop: 4 }}>{m.latency_ms} ms{m.sources?.length ? ` · ${m.sources.length} sources` : ""}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
