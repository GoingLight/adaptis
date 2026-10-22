import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { auth } from "../api/client";
import { me } from "../api/endpoints";
import { useLoad } from "./ui";
import { LangSwitch, useT } from "../i18n";

export const Mark = ({ lg }: { lg?: boolean }) => <span className={`blob ${lg ? "lg" : ""}`}><i /></span>;
export const Wordmark = ({ to = "/" }: { to?: string }) => <Link to={to} className="wordmark"><Mark />adaptis</Link>;

export default function Layout() {
  const nav = useNavigate();
  const { t } = useT();
  const { data } = useLoad(me);
  const email = data?.user.email ?? "";
  return (
    <>
      <header className="topbar">
        <div className="in">
          <Wordmark to="/agents" />
          <nav><NavLink to="/agents">{t("agents")}</NavLink></nav>
          <div className="who">
            <LangSwitch />
            <span><b>{data?.workspaces[0]?.name}</b>{email}</span>
            <div className="avatar" title={email}>{email.slice(0, 1).toUpperCase()}</div>
            <button className="btn ghost sm" onClick={() => { auth.logout(); nav("/login"); }}>{t("logout")}</button>
          </div>
        </div>
      </header>
      <main className="main"><Outlet /></main>
    </>
  );
}
