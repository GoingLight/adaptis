import { api } from "./client";
import type { Agent, Channel, Conversation, Job, Me, Paginated, Source, WidgetConfig } from "./types";

export const me = () => api<Me>("/api/auth/me/");

export const agents = {
  list: () => api<Paginated<Agent>>("/api/agents/"),
  get: (id: number) => api<Agent>(`/api/agents/${id}/`),
  create: (data: Partial<Agent>) => api<Agent>("/api/agents/", { method: "POST", json: data }),
  update: (id: number, data: Partial<Agent>) => api<Agent>(`/api/agents/${id}/`, { method: "PATCH", json: data }),
  remove: (id: number) => api(`/api/agents/${id}/`, { method: "DELETE" }),
  widget: (id: number) => api<WidgetConfig>(`/api/agents/${id}/widget/`),
  updateWidget: (id: number, data: Partial<WidgetConfig>) => api<WidgetConfig>(`/api/agents/${id}/widget/`, { method: "PATCH", json: data }),
  embed: (id: number) => api<{ public_key: string; snippet: string }>(`/api/agents/${id}/embed/`),
};

export const sources = {
  list: (agentId: number) => api<Paginated<Source>>(`/api/agents/${agentId}/sources/`),
  createFile: (agentId: number, file: File, title?: string) => {
    const form = new FormData();
    form.append("type", "file"); form.append("file", file);
    if (title) form.append("title", title);
    return api<Source>(`/api/agents/${agentId}/sources/`, { method: "POST", form });
  },
  create: (agentId: number, data: { type: "url" | "text" | "faq"; title?: string; url?: string; raw_text?: string }) =>
    api<Source>(`/api/agents/${agentId}/sources/`, { method: "POST", json: data }),
  update: (agentId: number, id: number, data: Partial<{ title: string; url: string; raw_text: string }>) =>
    api<Source>(`/api/agents/${agentId}/sources/${id}/`, { method: "PATCH", json: data }),
  remove: (agentId: number, id: number) => api(`/api/agents/${agentId}/sources/${id}/`, { method: "DELETE" }),
  train: (agentId: number) => api<Job>(`/api/agents/${agentId}/train/`, { method: "POST" }),
  jobs: (agentId: number) => api<Paginated<Job>>(`/api/agents/${agentId}/jobs/`),
  job: (agentId: number, id: number) => api<Job>(`/api/agents/${agentId}/jobs/${id}/`),
};

export const conversations = {
  list: (agentId: number) => api<Paginated<Conversation>>(`/api/agents/${agentId}/conversations/`),
  get: (agentId: number, id: number) => api<Conversation>(`/api/agents/${agentId}/conversations/${id}/`),
};

export const channels = {
  list: (agentId: number) => api<Paginated<Channel>>(`/api/agents/${agentId}/channels/`),
  create: (agentId: number, data: Record<string, string>) => api<Channel>(`/api/agents/${agentId}/channels/`, { method: "POST", json: data }),
  update: (agentId: number, id: number, data: Record<string, string>) => api<Channel>(`/api/agents/${agentId}/channels/${id}/`, { method: "PATCH", json: data }),
  connect: async (agentId: number, id: number) => {
    try { return await api<Channel>(`/api/agents/${agentId}/channels/${id}/connect/`, { method: "POST" }); }
    catch (e: any) { if (e?.status === 400 && e.data?.status) return e.data as Channel; throw e; }
  },
  remove: (agentId: number, id: number) => api(`/api/agents/${agentId}/channels/${id}/`, { method: "DELETE" }),
};
