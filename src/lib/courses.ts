import { labels } from "@/lib/labels";

export type CourseLevel = "soCap" | "trungCap" | "caoCap";

export function levelOfSlug(slug: string): CourseLevel {
  if (slug.startsWith("trung-cap")) return "trungCap";
  if (slug.startsWith("cao-cap")) return "caoCap";
  return "soCap";
}

export const levelOrder: CourseLevel[] = ["soCap", "trungCap", "caoCap"];

export const levelLabel: Record<CourseLevel, string> = {
  soCap: labels.levels.soCap,
  trungCap: labels.levels.trungCap,
  caoCap: labels.levels.caoCap,
};
