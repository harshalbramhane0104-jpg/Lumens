import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/lms.functions";
import { Shell } from "@/components/Shell";
import { LectureCard } from "@/components/LectureCard";
import { kindStyle, thumb } from "@/lib/thumbs";

const dashQuery = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lumen" },
      {
        name: "description",
        content: "Your learning dashboard: progress, continue watching and recommended lectures.",
      },
      { property: "og:title", content: "Dashboard — Lumen" },
      { property: "og:description", content: "Your learning dashboard on Lumen." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashQuery),
  component: Dashboard,
  errorComponent: ({ error }) => (
    <div className="p-10 text-destructive">{(error as Error).message}</div>
  ),
  notFoundComponent: () => <div className="p-10">Not found</div>,
});

function useCount(target: number, ms = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { data } = useSuspenseQuery(dashQuery);
  const { stats, lectures } = data;
  const overall = stats.total
    ? Math.round(lectures.reduce((s, l) => s + l.percent, 0) / stats.total)
    : 0;
  const ringPct = useCount(overall);
  const xp = useCount(stats.xp);
  const hours = useCount(stats.hours * 10);
  const started = lectures
    .filter((l) => l.percent > 0 && l.percent < 100)
    .sort((a, b) => b.percent - a.percent);
  const continueList = (
    started.length ? started : lectures.filter((l) => l.kind === "video")
  ).slice(0, 3);
  const nowPlaying =
    continueList.find((l) => l.kind === "video") ?? lectures.find((l) => l.kind === "video");
  const firstName = data.name.split(" ")[0];

  const statCards = [
    {
      label: "In progress",
      value: String(stats.inProgress),
      sub: `of ${stats.total} lectures`,
      tone: "text-accent",
    },
    {
      label: "Completed",
      value: String(stats.completed),
      sub: "lectures finished",
      tone: "text-muted-foreground",
    },
    {
      label: "Hours learned",
      value: (hours / 10).toFixed(1),
      sub: "watch time saved",
      tone: "text-amber",
    },
    {
      label: "XP earned",
      value: Math.round(xp).toLocaleString(),
      sub: `Level ${1 + Math.floor(stats.xp / 300)}`,
      tone: "text-muted-foreground",
    },
  ];

  return (
    <Shell name={data.name}>
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass relative overflow-hidden rounded-3xl p-6 animate-rise lg:col-span-2">
          <div className="absolute -right-10 -top-16 size-56 rounded-full bg-brand/30 blur-3xl animate-drift" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">
              {greeting()}, {firstName}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Keep the momentum going
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              You're {overall}% through your library
              {nowPlaying && (
                <>
                  {" "}
                  — next up: <span className="text-accent">{nowPlaying.title}</span>
                </>
              )}
              .
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {nowPlaying && (
                <Link
                  to="/lecture/$id"
                  params={{ id: nowPlaying.id }}
                  className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand/30 hover:brightness-110"
                >
                  Continue learning
                </Link>
              )}
              <a
                href="#library"
                className="glass rounded-xl px-5 py-2.5 text-sm hover:bg-foreground/10"
              >
                Browse catalog
              </a>
            </div>
          </div>
        </div>
        <div className="glass flex flex-col items-center justify-center rounded-3xl p-6 animate-rise [animation-delay:100ms]">
          <p className="self-start text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            Overall progress
          </p>
          <div className="relative my-2 size-36">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="var(--brand)" />
                  <stop offset="1" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--glass-border)"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#g)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * ringPct) / 100}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-3xl font-bold">{Math.round(ringPct)}%</p>
                <p className="text-[11px] text-muted-foreground">{stats.completed} done</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.hours.toFixed(1)}h watched in total
          </p>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((s, i) => (
          <div
            key={s.label}
            className="glass rounded-2xl p-4 animate-rise"
            style={{ animationDelay: `${150 + i * 70}ms` }}
          >
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
            <p className={`mt-1 text-[11px] ${s.tone}`}>{s.sub}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold tracking-tight">Continue watching</h2>
          <p className="text-sm text-muted-foreground">
            {started.length ? "Picked up right where you left off" : "Start with these lectures"}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {continueList.map((l, i) => (
            <LectureCard key={l.id} l={l} delay={i * 80} />
          ))}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {nowPlaying && (
          <div className="glass rounded-3xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold tracking-tight">Up next</h2>
              <span className="text-[11px] text-muted-foreground">Streaming · HD</span>
            </div>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row">
              <Link
                to="/lecture/$id"
                params={{ id: nowPlaying.id }}
                className="group relative shrink-0 sm:w-56"
              >
                <img
                  src={thumb(nowPlaying.thumbnail)}
                  alt=""
                  width={1088}
                  height={608}
                  className="aspect-video w-full rounded-xl object-cover"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-12 place-items-center rounded-full bg-foreground text-lg text-ink transition group-hover:scale-110">
                    ▶
                  </span>
                </span>
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-accent">{nowPlaying.course.title}</p>
                <h3 className="mt-1 font-display text-lg font-semibold">{nowPlaying.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nowPlaying.course.instructor} · {nowPlaying.meta} total
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-gradient-brand animate-grow"
                    style={{ width: `${nowPlaying.percent}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{nowPlaying.percent}%</span>
                  <span>{nowPlaying.meta}</span>
                </div>
                <div className="mt-4 flex h-5 items-end justify-end gap-0.5">
                  {[0.9, 1.2, 1, 1.1, 0.8].map((d, i) => (
                    <span
                      key={i}
                      className="w-1 rounded bg-accent/80 animate-eq"
                      style={{ animationDuration: `${d}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg font-bold tracking-tight">Recent activity</h2>
          {data.recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Open any lecture — your activity will show up here.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {data.recent.map((r) => (
                <li key={r.lecture_id} className="flex gap-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-brand/20 text-sm">
                    {r.completed ? "✓" : "▶"}
                  </span>
                  <div>
                    <p className="text-sm">
                      {r.completed ? "Completed" : "Watched"} “{r.title}”
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.updated_at).toLocaleString()} · {r.percent}%
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="library" className="mt-8 pb-10">
        <h2 className="mb-1 font-display text-xl font-bold tracking-tight">All lectures</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {Object.entries(kindStyle).map(([k, v]) => (
            <span key={k} className={`mr-3 ${v.text}`}>
              {v.label}
            </span>
          ))}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lectures.map((l, i) => (
            <LectureCard key={l.id} l={l} delay={i * 60} />
          ))}
        </div>
      </section>
    </Shell>
  );
}
