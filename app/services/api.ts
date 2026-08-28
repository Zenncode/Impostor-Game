// Lightweight fetch wrapper (no external deps) — pink game API stub
export type ApiResponse<T> = { data: T; ok: boolean };

const api = {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const res = await fetch(url);
    const data = (await res.json()) as T;
    return { data, ok: res.ok };
  },
  async post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json()) as T;
    return { data, ok: res.ok };
  },
};

export default api;
