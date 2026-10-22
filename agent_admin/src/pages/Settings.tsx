import { FormEvent, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { agents } from "../api/endpoints";
import { errText } from "../components/ui";
import type { AgentCtx } from "./AgentLayout";
import { useT } from "../i18n";

export default function Settings() {
  const { agent, reload } = useOutletContext<AgentCtx>();
  const nav = useNavigate();
  const { t } = useT();
  const [f, setF] = useState({ name: agent.name, description: agent.description, language: agent.language, greeting: agent.greeting, fallback_message: agent.fallback_message, system_prompt: agent.system_prompt, is_active: agent.is_active });
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const upd = (k: keyof typeof f, v: string | boolean) => setF({ ...f, [k]: v });

  async function save(e: FormEvent) {
    e.preventDefault(); setMsg({});
    try { await agents.update(agent.id, f); reload(); setMsg({ ok: t("saved") }); } catch (ex) { setMsg({ err: errText(ex) }); }
  }

  return (
    <form className="card" onSubmit={save}>
      <h2>{t("agentSettings")}</h2>
      <div className="grid cols-2">
        <div><label>{t("name")}</label><input value={f.name} onChange={(e) => upd("name", e.target.value)} required /></div>
        <div><label>{t("replyLang")}</label>
          <select value={f.language} onChange={(e) => upd("language", e.target.value)}>
            <option value="uz">O‘zbek</option><option value="ru">Русский</option><option value="en">English</option>
          </select></div>
      </div>
      <label>{t("description")}</label><input value={f.description} onChange={(e) => upd("description", e.target.value)} />
      <label>{t("greeting")}</label><input value={f.greeting} onChange={(e) => upd("greeting", e.target.value)} />
      <label>{t("fallback")}</label><input value={f.fallback_message} onChange={(e) => upd("fallback_message", e.target.value)} />
      <label>{t("instructions")} <span className="muted small">{t("instructionsHint")}</span></label>
      <textarea value={f.system_prompt} onChange={(e) => upd("system_prompt", e.target.value)} placeholder={t("instructionsPh")} style={{ minHeight: 150 }} />
      <label className="row-inline"><input type="checkbox" checked={f.is_active} onChange={(e) => upd("is_active", e.target.checked)} /> {t("agentActive")}</label>
      {msg.err && <div className="error">{msg.err}</div>}{msg.ok && <div className="ok">{msg.ok}</div>}
      <div className="actions">
        <button className="btn">{t("save")}</button>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn danger" onClick={async () => { if (confirm(`${agent.name}: ${t("deleteAgentConfirm")}`)) { await agents.remove(agent.id); nav("/agents"); } }}>{t("deleteAgent")}</button>
      </div>
    </form>
  );
}
