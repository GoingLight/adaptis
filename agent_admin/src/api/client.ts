const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const store = {
  get access() { return localStorage.getItem("access"); },
  get refresh() { return localStorage.getItem("refresh"); },
  set(a: string, r: string) { localStorage.setItem("access", a); localStorage.setItem("refresh", r); },
  clear() { localStorage.removeItem("access"); localStorage.removeItem("refresh"); },
};

export class ApiError extends Error {
  constructor(public status: number, public data: any) {
    super(typeof data === "string" ? data : data?.detail || JSON.stringify(data));
  }
}

async function refreshToken(): Promise<boolean> {
  const r = store.refresh;
  if (!r) return false;
  const res = await fetch(`${BASE}/api/auth/refresh/`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: r }),
  });
  if (!res.ok) { store.clear(); return false; }
  const d = await res.json();
  store.set(d.access, d.refresh ?? r);
  return true;
}

export async function api<T = any>(path: string, opts: RequestInit & { form?: FormData; json?: any } = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as any) };
  let body: BodyInit | undefined = opts.body as any;
  if (opts.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(opts.json); }
  if (opts.form) body = opts.form;
  if (store.access) headers.Authorization = `Bearer ${store.access}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers, body });
  if (res.status === 401 && retry && (await refreshToken())) return api<T>(path, opts, false);
  if (res.status === 204) return undefined as T;
  const data = res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export const auth = {
  isLoggedIn: () => !!store.access,
  async login(email: string, password: string) {
    const d = await api<{ access: string; refresh: string }>("/api/auth/login/", { method: "POST", json: { email, password } });
    store.set(d.access, d.refresh);
  },
  async register(email: string, password: string, company_name: string) {
    const d = await api<{ access: string; refresh: string }>("/api/auth/register/", { method: "POST", json: { email, password, company_name } });
    store.set(d.access, d.refresh);
  },
  logout: () => store.clear(),
};

export const publicBase = BASE;
