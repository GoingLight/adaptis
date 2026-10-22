import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../api/client";
import { Wordmark } from "../components/Layout";
import { LangSwitch } from "../i18n";
import { errText } from "../components/ui";
import { useT } from "../i18n";

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const nav = useNavigate();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (mode === "login") await auth.login(email, password);
      else await auth.register(email, password, company);
      nav("/agents");
    } catch (ex) { setErr(errText(ex)); } finally { setBusy(false); }
  }

  return (
    <div className="auth">
      <div className="bg" /><div className="bg two" />
      <form className="card" onSubmit={submit}>
        <div className="row-inline" style={{ justifyContent: "space-between", marginBottom: 28 }}><Wordmark /><LangSwitch /></div>
        <h1 style={{ fontSize: 28 }}>{mode === "login" ? t("welcomeBack") : t("startCompany")}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{mode === "login" ? t("signInSub") : t("registerSub")}</p>
        {mode === "register" && (<><label>{t("companyName")}</label><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Safia Bakery" required /></>)}
        <label>{t("email")}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.uz" required />
        <label>{t("password")}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} placeholder={mode === "register" ? t("pwHint") : ""} required />
        {err && <div className="error">{err}</div>}
        <div className="actions"><button className="btn lg" disabled={busy} style={{ width: "100%" }}>{mode === "login" ? t("signIn") : t("createWorkspace")}</button></div>
        <p className="small muted" style={{ marginTop: 18, textAlign: "center" }}>
          {mode === "login" ? <>{t("newHere")} <Link to="/register">{t("createWs")}</Link></> : <>{t("haveAccount")} <Link to="/login">{t("signIn")}</Link></>}
        </p>
      </form>
    </div>
  );
}
