import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getLecture, saveProgress } from "@/lib/lms.functions";
import { Ambient } from "@/components/Ambient";
import { kindOf, thumb } from "@/lib/thumbs";

const lectureQuery = (id: string) =>
  queryOptions({ queryKey: ["lecture", id], queryFn: () => getLecture({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/lecture/$id")({
  head: () => ({
    meta: [
      { title: "Lecture — Lumen" },
      { name: "description", content: "Watch and study this lecture on Lumen." },
      { property: "og:title", content: "Lecture — Lumen" },
      { property: "og:description", content: "Watch and study this lecture on Lumen." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(lectureQuery(params.id)),
  component: LecturePage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-destructive">{(error as Error).message}</div>
  ),
  notFoundComponent: () => <div className="p-10">Lecture not found</div>,
});

function LecturePage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(lectureQuery(id));
  const qc = useQueryClient();
  const { lecture, streamUrl, progress } = data;
  const k = kindOf(lecture.kind);
  const lastSave = useRef(0);
  const [pct, setPct] = useState(progress.percent);

  async function persist(percent: number, position: number) {
    setPct(Math.round(percent));
    await saveProgress({ data: { lectureId: lecture.id, percent, position } });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <div className="relative min-h-screen">
      <Ambient />
      <div className="relative mx-auto max-w-5xl px-4 py-6 md:px-6">
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to dashboard
        </Link>
        <div className="glass mt-4 overflow-hidden rounded-3xl animate-rise">
          {streamUrl ? (
            <video
              src={streamUrl}
              controls
              poster={thumb(lecture.thumbnail)}
              className="aspect-video w-full bg-ink"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (progress.position_seconds && progress.position_seconds < v.duration - 2)
                  v.currentTime = progress.position_seconds;
              }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (!v.duration || Date.now() - lastSave.current < 5000) return;
                lastSave.current = Date.now();
                persist((v.currentTime / v.duration) * 100, v.currentTime);
              }}
              onEnded={() => persist(100, 0)}
            />
          ) : (
            <div className="relative">
              <img
                src={thumb(lecture.thumbnail)}
                alt=""
                width={1088}
                height={608}
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-0 grid place-items-center bg-ink/50">
                <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${k.badge}`}>
                  {k.label} · {lecture.meta}
                </span>
              </div>
            </div>
          )}
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className={`rounded-full px-2.5 py-1 font-medium ${k.badge}`}>{k.label}</span>
              <span className="text-muted-foreground">
                {lecture.course?.title} · {lecture.course?.instructor}
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{lecture.title}</h1>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-gradient-brand transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{pct}% complete</p>
            {!streamUrl && (
              <button
                onClick={async () => {
                  await persist(100, 0);
                  toast.success("Marked as complete");
                }}
                className="mt-5 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand/30"
              >
                Mark as complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
