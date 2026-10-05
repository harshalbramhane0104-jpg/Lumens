import coding from "@/assets/thumb-coding.jpg";
import instructor from "@/assets/thumb-instructor.jpg";
import notebook from "@/assets/thumb-notebook.jpg";
import quiz from "@/assets/thumb-quiz.jpg";
import terminal from "@/assets/thumb-terminal.jpg";
import cloud from "@/assets/thumb-cloud.jpg";
import live from "@/assets/thumb-live.jpg";

const map: Record<string, string> = {
  coding,
  instructor,
  notebook,
  quiz,
  terminal,
  cloud,
  live,
  keyboard: coding,
  paper: notebook,
};
export const thumb = (k: string) => map[k] ?? coding;

export const kindStyle: Record<
  string,
  { label: string; badge: string; text: string; icon: string }
> = {
  video: { label: "Video", badge: "bg-brand/80", text: "text-accent", icon: "▶" },
  live: { label: "Live", badge: "bg-rose/90", text: "text-rose", icon: "●" },
  article: { label: "Article", badge: "bg-violet/80", text: "text-violet", icon: "≡" },
  quiz: { label: "Quiz", badge: "bg-rose/80", text: "text-rose", icon: "?" },
  lab: {
    label: "Coding lab",
    badge: "bg-accent/80 text-accent-foreground",
    text: "text-accent",
    icon: ">_",
  },
  pdf: { label: "PDF", badge: "bg-amber/90 text-accent-foreground", text: "text-amber", icon: "↓" },
};

export const kindOf = (kind: string) => kindStyle[kind] ?? kindStyle["video"]!;
