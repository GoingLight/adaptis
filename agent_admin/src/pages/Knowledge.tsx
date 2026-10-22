import { FormEvent, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { sources as srcApi } from "../api/endpoints";
import type { Job, Source, SourceType } from "../api/types";
import { Badge, errText, fmtBytes, fmtDate, useLoad } from "../components/ui";
import type { AgentCtx } from "./AgentLayout";
import { useT } from "../i18n";

const ACTIVE = new Set(["pending", "extracting", "indexing"]);

export default function Knowledge() {
  const { agent, reload: reloadAgent } = useOutletContext<AgentCtx>();
  const { t } = useT();
  const list = useLoad(() => srcApi.list(agent.id), [agent.id]);
  const jobs = useLoad(() => srcApi.jobs(agent.id), [agent.id]);
  const [tab, setTab] = useState<SourceType>("file");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);

  const rows = list.data?.results ?? [];
  const latestJob = jobs.data?.results[0];
  const readyCount = rows.filter((s) => s.status === "ready").length;
  const jobActive = latestJob && (latestJob.status === "queued" || latestJob.status === "running");

  // poll while anything is in flight
  useEffect(() => {
    const busyRows = rows.some((s) => ACTIVE.has(s.status));
    if (!busyRows && !jobActive) return;
    const t = setInterval(() => { list.reload(); jobs.reload(); reloadAgent(); }, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((r) => r.status).join(","), latestJob?.status]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setErr(null);
    try { await fn(); list.reload(); jobs.reload(); } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="grid rail" style={{ alignItems: "start" }}>
        <div className="card">
          <h2>{t("addKnowledge")}</h2>
          <div className="tabs">
            {(["file", "url", "text", "faq"] as SourceType[]).map((tab_) => (
              <a key={tab_} href="#" className={tab === tab_ ? "active" : ""} onClick={(e) => { e.preventDefault(); setTab(tab_); }}>
                {{ file: t("file"), url: t("website"), text: t("text"), faq: t("faq") }[tab_]}
              </a>
            ))}
          </div>
          {tab === "file" && <FileForm onSubmit={(f, title) => run(() => srcApi.createFile(agent.id, f, title))} busy={busy} />}
          {tab === "url" && <SimpleForm key="url" fields={[["url", t("pageUrl"), "https://yourcompany.uz/about"]]} onSubmit={(d) => run(() => srcApi.create(agent.id, { type: "url", url: d.url, title: d.url }))} busy={busy} />}
          {tab === "text" && <SimpleForm key="text" fields={[["title", t("title"), "Delivery policy"], ["raw_text", t("text"), t("textPh"), true]]} onSubmit={(d) => run(() => srcApi.create(agent.id, { type: "text", title: d.title, raw_text: d.raw_text }))} busy={busy} />}
          {tab === "faq" && <FaqForm onSubmit={(title, raw) => run(() => srcApi.create(agent.id, { type: "faq", title, raw_text: raw }))} busy={busy} />}
          {err && <div className="error">{err}</div>}
        </div>

        <div className="card rail-side">
          <h2>{t("training")}</h2>
          <p className="muted small">{t("trainingSub")}</p>
          <div style={{ marginTop: 14 }}>
            <button className="btn" disabled={busy || !!jobActive || readyCount === 0} onClick={() => run(() => srcApi.train(agent.id))}>
              {jobActive ? t("training_") : `${t("trainAgent")}${readyCount ? ` (${readyCount} ${t("new_")})` : ""}`}
            </button>
            {latestJob && <div className="small muted" style={{ marginTop: 12 }}><Badge status={latestJob.status} /> · {fmtDate(latestJob.finished_at ?? latestJob.created_at)}</div>}
          </div>
          {latestJob?.error && <div className="error">{latestJob.error}</div>}
          <JobHistory jobs={jobs.data?.results ?? []} />
        </div>
      </div>

      <div className="card">
        <h2>{t("sourcesTitle")} <span className="count">{rows.length}</span></h2>
        {list.loading && <p className="muted">{t("loading")}</p>}
        {rows.length === 0 && !list.loading && <div className="empty"><strong>{t("noKnowledge")}</strong>{t("noKnowledgeSub")}</div>}
        {rows.length > 0 && (
          <table>
            <thead><tr><th>{t("title")}</th><th>{t("type")}</th><th>{t("status")}</th><th>{t("size")}</th><th>{t("indexed")}</th><th></th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.title}</strong>
                    {s.error && <div className="error small">{s.error}</div>}
                    {s.preview && <div className="muted small" style={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.preview}</div>}
                  </td>
                  <td><span className="kind">{s.type}</span></td>
                  <td><Badge status={s.status} /></td>
                  <td className="small muted">{s.char_count ? `${s.char_count.toLocaleString()} ${t("chars")}` : s.size_bytes ? fmtBytes(s.size_bytes) : "—"}</td>
                  <td className="small muted">{fmtDate(s.last_indexed_at)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {(s.type === "text" || s.type === "faq" || s.type === "url") && <button className="btn secondary sm" onClick={() => setEditing(s)}>{t("edit")}</button>}{" "}
                    <button className="btn danger sm" disabled={busy} onClick={() => confirm(`${t("confirmDelete")} "${s.title}"?`) && run(() => srcApi.remove(agent.id, s.id))}>{t("delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && <EditModal source={editing} onClose={() => setEditing(null)} onSave={(d) => run(() => srcApi.update(agent.id, editing.id, d)).then(() => setEditing(null))} />}
    </>
  );
}

/* ---------- sub-forms ---------- */

function FileForm({ onSubmit, busy }: { onSubmit: (f: File, title?: string) => void; busy: boolean }) {
  const { t } = useT();
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pick = (files: FileList | null) => { if (files) Array.from(files).forEach((f) => onSubmit(f)); };
  return (
    <>
      <div className={`drop ${over ? "over" : ""}`} onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}>
        <strong>{t("dropFiles")}</strong> {t("orClick")}<br /><span className="small">{t("fileTypes")}</span>
        <input ref={input} type="file" multiple accept=".pdf,.docx,.txt,.md,.csv,.html,.htm" style={{ display: "none" }} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} disabled={busy} />
      </div>
    </>
  );
}

function SimpleForm({ fields, onSubmit, busy }: { fields: [string, string, string, boolean?][]; onSubmit: (d: Record<string, string>) => void; busy: boolean }) {
  const { t } = useT();
  const [d, setD] = useState<Record<string, string>>({});
  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(d); setD({}); }}>
      {fields.map(([k, label, ph, area]) => (
        <div key={k}><label>{label}</label>
          {area ? <textarea value={d[k] ?? ""} onChange={(e) => setD({ ...d, [k]: e.target.value })} placeholder={ph} required />
                : <input value={d[k] ?? ""} onChange={(e) => setD({ ...d, [k]: e.target.value })} placeholder={ph} required />}
        </div>
      ))}
      <div className="actions"><button className="btn" disabled={busy}>{t("add")}</button></div>
    </form>
  );
}

function FaqForm({ onSubmit, busy }: { onSubmit: (title: string, rawJson: string) => void; busy: boolean }) {
  const { t } = useT();
  const [title, setTitle] = useState("FAQ");
  const [items, setItems] = useState([{ q: "", a: "" }]);
  const set = (i: number, k: "q" | "a", v: string) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(title, JSON.stringify(items.filter((i) => i.q && i.a))); setItems([{ q: "", a: "" }]); }}>
      <label>{t("title")}</label><input value={title} onChange={(e) => setTitle(e.target.value)} required />
      {items.map((it, i) => (
        <div key={i} style={{ borderTop: "1px solid var(--line)", marginTop: 10, paddingTop: 4 }}>
          <label>{t("question")} {i + 1}</label><input value={it.q} onChange={(e) => set(i, "q", e.target.value)} placeholder="What are your working hours?" />
          <label>{t("answer")}</label><textarea value={it.a} onChange={(e) => set(i, "a", e.target.value)} style={{ minHeight: 60 }} placeholder="Mon–Sat 9:00–18:00" />
        </div>
      ))}
      <div className="actions">
        <button type="button" className="btn secondary" onClick={() => setItems([...items, { q: "", a: "" }])}>{t("addQuestion")}</button>
        <button className="btn" disabled={busy || !items.some((i) => i.q && i.a)}>{t("addFaq")}</button>
      </div>
    </form>
  );
}

function EditModal({ source, onClose, onSave }: { source: Source; onClose: () => void; onSave: (d: { title: string; url?: string; raw_text?: string }) => void }) {
  const { t } = useT();
  const [title, setTitle] = useState(source.title);
  const [url, setUrl] = useState(source.url);
  const [text, setText] = useState("");
  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave({ title, ...(source.type === "url" ? { url } : {}), ...(text ? { raw_text: text } : {}) }); }}>
        <h2>{t("editSource")}</h2>
        <label>{t("title")}</label><input value={title} onChange={(e) => setTitle(e.target.value)} required />
        {source.type === "url" && (<><label>URL</label><input value={url} onChange={(e) => setUrl(e.target.value)} /></>)}
        {source.type !== "url" && (<><label>{t("replaceContent")} {source.type === "faq" && <span className="muted small">(JSON list of {"{q, a}"})</span>}</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("replaceHint") + "\n" + source.preview} /></>)}
        <p className="small muted">{t("reextractNote")}</p>
        <div className="actions"><button className="btn">{t("save")}</button><button type="button" className="btn secondary" onClick={onClose}>{t("cancel")}</button></div>
      </form>
    </div>
  );
}

function JobHistory({ jobs }: { jobs: Job[] }) {
  const { t } = useT();
  if (jobs.length < 2) return null;
  return (
    <details style={{ marginTop: 12 }}>
      <summary className="small muted" style={{ cursor: "pointer" }}>{t("prevRuns")}</summary>
      <table style={{ marginTop: 8 }}><tbody>
        {jobs.slice(1, 8).map((j) => (<tr key={j.id}><td className="small">{fmtDate(j.created_at)}</td><td><Badge status={j.status} /></td><td className="small muted">{j.source_ids.length} sources{j.deleted_source_ids.length ? `, ${j.deleted_source_ids.length} removed` : ""}</td></tr>))}
      </tbody></table>
    </details>
  );
}
