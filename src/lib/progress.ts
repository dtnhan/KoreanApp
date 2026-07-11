import { prisma } from "@/lib/prisma";

/** Tập hợp lessonId đã hoàn thành của một user. */
export async function getCompletedLessonIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.userLessonProgress.findMany({
    where: { userId },
    select: { lessonId: true },
  });
  return new Set(rows.map((r) => r.lessonId));
}

export function percent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export type CourseWithProgress = {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  lessonCount: number;
  progress?: { completed: number; percent: number };
};

/**
 * Danh sách khóa học kèm tiến độ của user (nếu có userId).
 * Với khách (không userId), trường progress bị bỏ trống.
 */
export async function getCoursesWithProgress(
  userId?: string,
): Promise<CourseWithProgress[]> {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { lessons: { select: { id: true } } },
  });
  const completedIds = userId ? await getCompletedLessonIds(userId) : null;

  return courses.map((c) => {
    const total = c.lessons.length;
    const completed = completedIds
      ? c.lessons.filter((l) => completedIds.has(l.id)).length
      : 0;
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      order: c.order,
      lessonCount: total,
      progress: completedIds
        ? { completed, percent: percent(completed, total) }
        : undefined,
    };
  });
}
