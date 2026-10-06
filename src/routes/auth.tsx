import { Logo } from "@/components/Logo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, getToken, setToken } from "@/lib/api";
import { Ambient } from "@/components/Ambient";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lumen" },
      { name: "description", content: "Sign in or create your Lumen learning account." },
      { property: "og:title", content: "Sign in — Lumen" },
      { property: "og:description", content: "Sign in or create your Lumen learning account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then(() => navigate({ to: "/dashboard" }))
      .catch(() => {});
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res =
        mode === "up"
          ? await api<{ token: string }>("/auth/signup", {
              method: "POST",
              body: { email, password, name },
            })
          : await api<{ token: string }>("/auth/login", {
              method: "POST",
              body: { email, password },
            });
      setToken(res.token);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-xl glass px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand/60";

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <Ambient />
      <div className="glass relative w-full max-w-sm rounded-3xl p-8 animate-rise">
        <Logo className="size-11" />
        <h1 className="mt-5 font-display text-2xl font-bold">
          {mode === "in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your progress is saved to your account.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "up" && (
            <input
              className={input}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className={input}
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={input}
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={busy}
            className="w-full rounded-xl bg-gradient-brand py-2.5 text-sm font-semibold shadow-lg shadow-brand/30 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 w-full text-center text-sm text-accent hover:underline"
        >
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
