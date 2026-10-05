import { createFileRoute, Link } from "@tanstack/react-router";
import { Ambient } from "@/components/Ambient";
import coding from "@/assets/thumb-coding.jpg";
import quiz from "@/assets/thumb-quiz.jpg";
import live from "@/assets/thumb-live.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Learn, Stream, Master" },
      {
        name: "description",
        content:
          "Stream video lectures, join live sessions, take quizzes and track your progress in one place.",
      },
      { property: "og:title", content: "Lumen — Learn, Stream, Master" },
      {
        property: "og:description",
        content: "Stream video lectures, join live sessions, take quizzes and track your progress.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Ambient />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-brand font-display text-lg font-bold">
            L
          </div>
          <p className="font-display text-lg font-bold">Lumen</p>
          <Link to="/auth" className="glass ml-auto rounded-xl px-4 py-2 text-sm">
            Sign in
          </Link>
        </header>
        <main className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-2">
          <div className="animate-rise">
            <p className="text-sm text-accent">Learn · Stream · Master</p>
            <h1 className="mt-3 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Lectures that <span className="text-gradient-brand">keep up</span> with you.
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Video lessons, live sessions, quizzes, labs and notes — with progress saved
              automatically wherever you stop.
            </p>
            <Link
              to="/auth"
              className="mt-8 inline-flex rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold shadow-lg shadow-brand/30 hover:brightness-110"
            >
              Start learning
            </Link>
          </div>
          <div className="relative h-[420px]">
            {[
              { src: coding, cls: "left-0 top-0 w-72", d: 100, t: "Video" },
              { src: live, cls: "right-0 top-24 w-64", d: 250, t: "Live" },
              { src: quiz, cls: "left-16 bottom-0 w-64", d: 400, t: "Quiz" },
            ].map((c) => (
              <div
                key={c.t}
                className={`glass absolute overflow-hidden rounded-2xl animate-rise ${c.cls}`}
                style={{ animationDelay: `${c.d}ms` }}
              >
                <img
                  src={c.src}
                  alt={c.t}
                  width={1088}
                  height={608}
                  className="aspect-video w-full object-cover"
                />
                <p className="px-4 py-3 font-display text-sm font-semibold">{c.t} lecture</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
