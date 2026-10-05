import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Lecture = {
  id: string;
  title: string;
  kind: string;
  meta: string;
  thumbnail: string;
  duration_seconds: number;
  course: { title: string; instructor: string; category: string; color: string };
  percent: number;
};

type CourseInfo = { title: string; instructor: string; category: string; color: string };

type LectureRow = {
  id: string;
  title: string;
  kind: string;
  meta: string;
  thumbnail: string;
  duration_seconds: number;
  position: number;
  courses: CourseInfo | CourseInfo[] | null;
};

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: lectures, error }, { data: progress }, { data: profile }] = await Promise.all([
      supabase
        .from("lectures")
        .select(
          "id,title,kind,meta,thumbnail,duration_seconds,position,courses(title,instructor,category,color)",
        )
        .order("position"),
      supabase
        .from("lecture_progress")
        .select("lecture_id,percent,completed,updated_at")
        .eq("user_id", userId),
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    ]);
    if (error) throw new Error(error.message);
    const pmap = new Map((progress ?? []).map((p) => [p.lecture_id, p]));
    const list: Lecture[] = ((lectures ?? []) as unknown as LectureRow[]).map((l) => {
      const course = Array.isArray(l.courses) ? l.courses[0] : l.courses;
      return {
        id: l.id,
        title: l.title,
        kind: l.kind,
        meta: l.meta,
        thumbnail: l.thumbnail,
        duration_seconds: l.duration_seconds,
        course: course ?? {
          title: "General Course",
          instructor: "Instructor",
          category: "General",
          color: "brand",
        },
        percent: pmap.get(l.id)?.percent ?? 0,
      };
    });
    const completed = (progress ?? []).filter((p) => p.completed).length;
    const watchedSeconds = list.reduce((s, l) => s + (l.duration_seconds * l.percent) / 100, 0);
    const recent = [...(progress ?? [])]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 4)
      .map((p) => ({ ...p, title: list.find((l) => l.id === p.lecture_id)?.title ?? "" }));
    return {
      name: profile?.display_name ?? "Learner",
      lectures: list,
      stats: {
        inProgress: list.filter((l) => l.percent > 0 && l.percent < 100).length,
        completed,
        total: list.length,
        hours: watchedSeconds / 3600,
        xp: Math.round(watchedSeconds / 6) + completed * 100,
      },
      recent,
    };
  });

export const getLecture = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: l, error } = await supabase
      .from("lectures")
      .select("*, courses(title,instructor,category,color)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!l) throw new Error("Lecture not found");
    const { data: p } = await supabase
      .from("lecture_progress")
      .select("percent,position_seconds")
      .eq("user_id", userId)
      .eq("lecture_id", data.id)
      .maybeSingle();

    let streamUrl: string | null = l.fallback_url;
    let source: "s3" | "demo" | "none" = streamUrl ? "demo" : "none";
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const s3Key = process.env["AWS_S3_API_KEY"];
    if (l.s3_key && lovableKey && s3Key) {
      const res = await fetch(
        "https://connector-gateway.lovable.dev/api/v1/sign_storage_url?provider=aws_s3&mode=read",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": s3Key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ object_path: l.s3_key }),
        },
      );
      if (res.ok) {
        const j = (await res.json()) as { url: string };
        streamUrl = j.url;
        source = "s3";
      } else {
        console.error(`S3 sign failed [${res.status}]: ${await res.text()}`);
      }
    }
    const lectureData = l as unknown as { courses?: CourseInfo | CourseInfo[] | null };
    const course = Array.isArray(lectureData.courses)
      ? lectureData.courses[0]
      : lectureData.courses;
    return {
      lecture: {
        ...l,
        course: course ?? {
          title: "General Course",
          instructor: "Instructor",
          category: "General",
          color: "brand",
        },
      },
      streamUrl,
      source,
      progress: p ?? { percent: 0, position_seconds: 0 },
    };
  });

export const saveProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { lectureId: string; percent: number; position: number }) =>
    z
      .object({
        lectureId: z.string().uuid(),
        percent: z.number().min(0).max(100),
        position: z.number().min(0),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const pct = Math.round(data.percent);
    const { error } = await context.supabase.from("lecture_progress").upsert({
      user_id: context.userId,
      lecture_id: data.lectureId,
      percent: pct,
      position_seconds: Math.round(data.position),
      completed: pct >= 95,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
