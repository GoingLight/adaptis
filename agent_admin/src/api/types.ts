export interface Workspace { id: number; name: string; plan: string; role: string }
export interface Me { user: { id: number; email: string }; workspaces: Workspace[] }

export interface Agent {
  id: number; workspace: number; name: string; description: string; system_prompt: string;
  language: string; greeting: string; fallback_message: string; is_active: boolean;
  public_key: string; is_ready: boolean; sources_count: number; created_at: string; updated_at: string;
}

export type SourceType = "file" | "url" | "text" | "faq";
export type SourceStatus = "pending" | "extracting" | "ready" | "indexing" | "indexed" | "failed";

export interface Source {
  id: number; type: SourceType; title: string; file: string | null; url: string; status: SourceStatus;
  error: string; size_bytes: number; char_count: number; last_indexed_at: string | null;
  created_at: string; updated_at: string; preview: string;
}

export interface Job {
  id: number; status: "queued" | "running" | "done" | "failed"; source_ids: number[];
  deleted_source_ids: number[]; error: string; created_at: string; started_at: string | null; finished_at: string | null;
}

export interface WidgetConfig {
  id: number; primary_color: string; position: "bottom-right" | "bottom-left"; launcher_icon: string;
  avatar: string | null; title: string; placeholder: string; allowed_origins: string[]; show_branding: boolean;
}

export interface Conversation {
  id: number; channel: string; visitor_id: string; page_url: string; started_at: string;
  last_message_at: string; message_count: number; last_message: string; messages?: Message[];
}
export interface Message { id: number; role: "user" | "assistant"; content: string; sources: any[]; latency_ms: number | null; created_at: string }

export interface Paginated<T> { count: number; next: string | null; previous: string | null; results: T[] }

export type ChannelType = "telegram" | "instagram" | "facebook";
export interface Channel {
  id: number; type: ChannelType; username: string; status: "pending" | "connected" | "error"; error: string;
  is_active: boolean; created_at: string; last_message_at: string | null; webhook_url: string;
}
