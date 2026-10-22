import { NavLink, Outlet, useParams } from "react-router-dom";
import { agents } from "../api/endpoints";
import { useLoad } from "../components/ui";
import type { Agent } from "../api/types";
import { useT } from "../i18n";

export interface AgentCtx { agent: Agent; reload: () => void }

export default function AgentLayout() {
  const { t } = useT();
  const { id } = useParams();
  const agentId = Number(id);
  const { data: agent, error, reload } = useLoad(() => agents.get(agentId), [agentId]);
  if (error) return <div className="error">{error}</div>;
  if (!agent) return <p className="muted">{t("loading")}</p>;
  return (
    <>
      <div className="band">
        <div className="crumb"><NavLink to="/agents">{t("allAgents")}</NavLink> / {agent.name}</div>
        <h1>{agent.name} <span className={`chip-status ${agent.is_ready ? "live" : "pending"}`}>{agent.is_ready ? t("live") : t("notTrainedYet")}</span></h1>
        <nav className="tabs">
          <NavLink to="knowledge">{t("tabKnowledge")}</NavLink>
          <NavLink to="settings">{t("tabBehaviour")}</NavLink>
          <NavLink to="widget">{t("tabLook")}</NavLink>
          <NavLink to="channels">{t("tabChannels")}</NavLink>
          <NavLink to="conversations">{t("tabConversations")}</NavLink>
        </nav>
      </div>
      <Outlet context={{ agent, reload } satisfies AgentCtx} />
    </>
  );
}
