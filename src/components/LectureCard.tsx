import { Link } from "@tanstack/react-router";
import type { Lecture } from "@/lib/lms.functions";
import { kindOf, thumb } from "@/lib/thumbs";

export function LectureCard({ l, delay = 0 }: { l: Lecture; delay?: number }) {
  const k = kindOf(l.kind);
  return (
    <Link
      to="/lecture/$id"
      params={{ id: l.id }}
      style={{ animationDelay: `${delay}ms` }}
      className="group glass block overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:border-brand/40 animate-rise"
    >
      <div className="relative overflow-hidden">
        <img
          src={thumb(l.thumbnail)}
          alt={l.title}
          loading="lazy"
          width={1088}
          height={608}
          className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur ${k.badge}`}
        >
          {l.kind === "live" && (
            <span className="size-1.5 animate-pulse rounded-full bg-foreground" />
          )}
          {k.label}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-ink/60 px-2.5 py-1 text-[11px] backdrop-blur">
          {l.meta}
        </span>
        <div className="absolute inset-0 grid place-items-center bg-ink/20 opacity-0 transition group-hover:opacity-100">
          <span className="grid size-14 scale-90 place-items-center rounded-full bg-foreground text-xl font-bold text-ink transition group-hover:scale-100">
            {k.icon}
          </span>
        </div>
        {l.percent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-foreground/10">
            <div
              className="h-full bg-gradient-brand animate-grow"
              style={{ width: `${l.percent}%` }}
            />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className={`text-[11px] ${k.text}`}>{l.course.title}</p>
        <h3 className="mt-1 font-display font-semibold leading-snug">{l.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {l.course.instructor} · {l.percent > 0 ? `${l.percent}% complete` : "Not started"}
        </p>
      </div>
    </Link>
  );
}
