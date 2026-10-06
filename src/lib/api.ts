const BASE = (import.meta.env["VITE_API_URL"] as string | undefined) || "/api";
const TOKEN_KEY = "lumen_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable; the session simply won't persist
  }
  window.dispatchEvent(new CustomEvent("lumen-auth", { detail: { signedIn: Boolean(token) } }));
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    const options: RequestInit = { method: init.method ?? "GET", headers };
    if (init.body !== undefined) options.body = JSON.stringify(init.body);
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new Error("Cannot reach the server. Please try again.");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
    if (res.status === 401 && token) setToken(null);
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}
