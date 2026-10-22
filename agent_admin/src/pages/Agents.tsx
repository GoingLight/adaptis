import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { agents, me } from "../api/endpoints";
import { errText, useLoad } from "../components/ui";
import { useT } from "../i18n";

export default function Agents() {
  const nav = useNavigate();
  const { t } = useT();
  const list = useLoad(() => agents.list());
  const who = useLoad(me);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault(); setErr(null);
    try {
      const a = await agents.create({ workspace: who.data!.workspaces[0].id, name, description: desc });
      nav(`/agents/${a.id}/knowledge`);
    } catch (ex) { setErr(errText(ex)); }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>{t("agents")}</h1><p className="muted">{t("agentsSub")}</p></div>
        <button className="btn" onClick={() => setCreating(true)}>{t("newAgent")}</button>
      </div>

      {creating && (
        <form className="card" onSubmit={create} style={{ marginBottom: 16 }}>
          <h2>{t("newAgentTitle")}</h2>
          <label>{t("name")}</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePh")} required autoFocus />
          <label>{t("descOpt")}</label><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("descPh")} />
          {err && <div className="error">{err}</div>}
          <div className="actions"><button className="btn">{t("create")}</button><button type="button" className="btn secondary" onClick={() => setCreating(false)}>{t("cancel")}</button></div>
        </form>
      )}

      {list.loading && <p className="muted">{t("loading")}</p>}
      {list.error && <div className="error">{list.error}</div>}
      {list.data && list.data.results.length === 0 && !creating && <div className="card empty"><strong>{t("noAgents")}</strong>{t("noAgentsSub")}</div>}
      <div className="grid cols-3">
        {list.data?.results.map((a) => (
          <div key={a.id} className="card agent-card" onClick={() => nav(`/agents/${a.id}/knowledge`)}>
            <span className="go">→</span>
            <h3 style={{ margin: 0, paddingRight: 28 }}>{a.name}</h3>
            <p className="muted small" style={{ marginTop: 6 }}>{a.description || t("noDesc")}</p>
            <div className="row">
              <span className={`badge ${a.is_ready ? "live" : "pending"}`}>{a.is_ready ? t("live") : t("notTrained")}</span>
              <span className="small muted">{a.sources_count} {t("sources")} · {a.language.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
