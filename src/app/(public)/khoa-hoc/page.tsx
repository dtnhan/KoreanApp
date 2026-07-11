import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/CourseCard";
import { levelOfSlug, levelOrder, levelLabel, type CourseLevel } from "@/lib/courses";
import { labels } from "@/lib/labels";

export const metadata: Metadata = {
  title: labels.nav.courses,
  description: "Danh sách các khóa học tiếng Hàn theo giáo trình Tiếng Hàn Tổng Hợp.",
};

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { lessons: true } } },
  });

  const grouped: Record<CourseLevel, typeof courses> = {
    soCap: [],
    trungCap: [],
    caoCap: [],
  };
  for (const c of courses) grouped[levelOfSlug(c.slug)].push(c);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">{labels.nav.courses}</h1>
      <p className="mt-2 text-slate-600">
        Lộ trình học tiếng Hàn từ Sơ cấp đến Cao cấp theo giáo trình Tiếng Hàn Tổng Hợp.
      </p>

      <div className="mt-10 space-y-12">
        {levelOrder.map((level) =>
          grouped[level].length === 0 ? null : (
            <section key={level}>
              <h2 className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                <span className="h-6 w-1.5 rounded-full bg-brand-600" />
                {levelLabel[level]}
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[level].map((c) => (
                  <CourseCard
                    key={c.id}
                    slug={c.slug}
                    title={c.title}
                    description={c.description}
                    lessonCount={c._count.lessons}
                  />
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </div>
  );
}
