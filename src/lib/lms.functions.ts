import { api } from "@/lib/api";

type CourseInfo = { title: string; instructor: string; category: string; color: string };

export type Lecture = {
  id: string;
  title: string;
  kind: string;
  meta: string;
  thumbnail: string;
  duration_seconds: number;
  course: CourseInfo;
  percent: number;
};

type DashboardData = {
  name: string;
  lectures: Lecture[];
  stats: { inProgress: number; completed: number; total: number; hours: number; xp: number };
  recent: {
    lecture_id: string;
    percent: number;
    completed: boolean;
    updated_at: string;
    title: string;
  }[];
};

type LectureData = {
  lecture: {
    id: string;
    title: string;
    kind: string;
    meta: string;
    thumbnail: string;
    duration_seconds: number;
    position: number;
    course: CourseInfo;
  };
  streamUrl: string | null;
  progress: { percent: number; position_seconds: number };
};

export const getDashboard = () => api<DashboardData>("/dashboard");

export const getLecture = ({ data }: { data: { id: string } }) =>
  api<LectureData>(`/lectures/${encodeURIComponent(data.id)}`);

export const saveProgress = ({
  data,
}: {
  data: { lectureId: string; percent: number; position: number };
}) => api<{ ok: boolean }>("/progress", { method: "POST", body: data });
