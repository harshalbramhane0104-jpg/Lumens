import { Logo } from "./Logo";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ambient } from "./Ambient";

const nav = [{ label: "Dashboard", icon: "▦", to: "/dashboard" as const }];

export function Shell({ name, children }: { name: string; children: ReactNode }) {
  const navigate = useNavigate();
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Ambient />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-64 shrink-0 p-4 md:flex">
          <div className="glass sticky top-4 flex h-[calc(100vh-2rem)] w-full flex-col rounded-2xl p-5">
            <div className="flex items-center gap-3 px-1">
              <Logo className="size-10 drop-shadow-lg" />
              <div>
                <p className="font-display text-lg font-bold leading-none tracking-tight">Lumen</p>
                <p className="text-[11px] tracking-wide text-muted-foreground">
                  Learn · Stream · Master
                </p>
              </div>
            </div>
            <nav className="mt-8 space-y-1 text-sm">
              {nav.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-foreground/5"
                  activeProps={{
                    className: "bg-brand/25 text-foreground font-medium border border-glass-border",
                  }}
                >
                  <span>{n.icon}</span> {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto rounded-xl border border-glass-border bg-glass p-4">
              <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                Video delivery
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-brand animate-grow" />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Smooth, reliable playback</p>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <header className="flex items-center gap-4">
            <div className="max-w-md flex-1">
              <input
                className="glass w-full rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none"
                placeholder="Search lectures, instructors, topics…"
              />
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="glass hidden rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground sm:block"
            >
              Sign out
            </button>
            <div className="flex items-center gap-3 border-l border-glass-border pl-3">
              <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-violet to-rose font-display text-sm font-semibold">
                {initials}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-[11px] text-muted-foreground">Learner</p>
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
