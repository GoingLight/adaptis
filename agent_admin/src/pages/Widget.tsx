import { FormEvent, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { agents } from "../api/endpoints";
import type { WidgetConfig } from "../api/types";
import { CopyButton, errText, useLoad } from "../components/ui";
import type { AgentCtx } from "./AgentLayout";
import { useT } from "../i18n";

export default function Widget() {
  const { agent } = useOutletContext<AgentCtx>();
  const { t } = useT();
  const cfg = useLoad(() => agents.widget(agent.id), [agent.id]);
  const embed = useLoad(() => agents.embed(agent.id), [agent.id]);
  if (cfg.error) return <div className="error">{cfg.error}</div>;
  if (!cfg.data) return <p className="muted">{t("loading")}</p>;
  return (
    <div className="grid cols-2" style={{ alignItems: "start" }}>
      <WidgetForm agentId={agent.id} initial={cfg.data} onSaved={cfg.setData} />
      <div>
        <div className="card">
          <h2>{t("preview")}</h2>
          <p className="muted small">{t("previewSub")}</p>
          <Preview cfg={cfg.data} greeting={agent.greeting} />
        </div>
        <div className="card">
          <h2>{t("install")}</h2>
          <p className="muted small">{t("installSub")}</p>
          <pre className="snippet">{embed.data?.snippet ?? "…"}</pre>
          {embed.data && <CopyButton text={embed.data.snippet} />}
          {!agent.is_ready && <p className="error">{t("installWarn")}</p>}
        </div>
      </div>
    </div>
  );
}

function WidgetForm({ agentId, initial, onSaved }: { agentId: number; initial: WidgetConfig; onSaved: (c: WidgetConfig) => void }) {
  const { t } = useT();
  const [f, setF] = useState(initial);
  const [origin, setOrigin] = useState("");
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const upd = <K extends keyof WidgetConfig>(k: K, v: WidgetConfig[K]) => setF({ ...f, [k]: v });

  async function save(e: FormEvent) {
    e.preventDefault(); setMsg({});
    const { avatar, id, ...data } = f; void avatar; void id;
    try { const saved = await agents.updateWidget(agentId, data); setF(saved); onSaved(saved); setMsg({ ok: t("savedPreview") }); } catch (ex) { setMsg({ err: errText(ex) }); }
  }
  const addOrigin = () => { const o = origin.trim().replace(/\/$/, ""); if (o && !f.allowed_origins.includes(o)) upd("allowed_origins", [...f.allowed_origins, o]); setOrigin(""); };

  return (
    <form className="card" onSubmit={save}>
      <h2>{t("appearance")}</h2>
      <div className="grid cols-2">
        <div><label>{t("primaryColor")}</label><div className="row-inline"><input type="color" value={f.primary_color} onChange={(e) => upd("primary_color", e.target.value)} /><input value={f.primary_color} onChange={(e) => upd("primary_color", e.target.value)} /></div></div>
        <div><label>{t("position")}</label><select value={f.position} onChange={(e) => upd("position", e.target.value as WidgetConfig["position"])}><option value="bottom-right">{t("bottomRight")}</option><option value="bottom-left">{t("bottomLeft")}</option></select></div>
      </div>
      <label>{t("headerTitle")}</label><input value={f.title} onChange={(e) => upd("title", e.target.value)} />
      <label>{t("placeholder")}</label><input value={f.placeholder} onChange={(e) => upd("placeholder", e.target.value)} />
      <label className="row-inline"><input type="checkbox" checked={f.show_branding} onChange={(e) => upd("show_branding", e.target.checked)} /> {t("showBranding")}</label>

      <h2 style={{ marginTop: 22 }}>{t("allowedSites")}</h2>
      <p className="muted small">{t("allowedSitesSub")}</p>
      <div className="row-inline"><input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="https://yourcompany.uz" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOrigin())} /><button type="button" className="btn secondary" onClick={addOrigin}>{t("add")}</button></div>
      <div className="pill-list">{f.allowed_origins.map((o) => <span key={o} className="pill">{o}<button type="button" onClick={() => upd("allowed_origins", f.allowed_origins.filter((x) => x !== o))}>×</button></span>)}</div>

      {msg.err && <div className="error">{msg.err}</div>}{msg.ok && <div className="ok">{msg.ok}</div>}
      <div className="actions"><button className="btn">{t("save")}</button></div>
    </form>
  );
}

function Preview({ cfg, greeting }: { cfg: WidgetConfig; greeting: string }) {
  return (
    <div style={{ position: "relative", height: 300, background: "var(--canvas)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--line)" }}>
      <div style={{ position: "absolute", bottom: 86, [cfg.position === "bottom-left" ? "left" : "right"]: 16, width: 240, background: "#fff", borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,.12)", overflow: "hidden", fontSize: 12 }}>
        <div style={{ background: cfg.primary_color, color: "#fff", padding: "10px 12px", fontWeight: 700 }}>{cfg.title}</div>
        <div style={{ padding: 12 }}><div style={{ background: "var(--canvas)", borderRadius: 10, padding: "7px 10px", display: "inline-block" }}>{greeting}</div></div>
        <div style={{ borderTop: "1px solid var(--line)", padding: 8, color: "#999" }}>{cfg.placeholder}</div>
      </div>
      <div className="blob lg" style={{ position: "absolute", bottom: 18, [cfg.position === "bottom-left" ? "left" : "right"]: 18, background: cfg.primary_color, boxShadow: "0 10px 24px -8px rgba(30,22,51,.4)" }}><i /></div>
    </div>
  );
}
