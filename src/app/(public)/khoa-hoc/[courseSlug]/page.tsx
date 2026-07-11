import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCompletedLessonIds, percent } from "@/lib/progress";
import { labels } from "@/lib/labels";

type Props = { params: Promise<{ courseSlug: string }> };

async function getCourse(courseSlug: string) {
  return prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      lessons: { orderBy: { order: "asc" } },
      _count: { select: { lessons: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = await getCourse(courseSlug);
  if (!course) return { title: labels.common.notFound };
  return { title: course.title, description: course.description };
}

export default async function CoursePage({ params }: Props) {
  const { courseSlug } = await params;
  const course = await getCourse(courseSlug);
  if (!course) notFound();

  const session = await auth();
  const completedIds = session?.user
    ? await getCompletedLessonIds(session.user.id)
    : new Set<string>();
  const completedCount = course.lessons.filter((l) => completedIds.has(l.id)).length;
  const total = course._count.lessons;
  const pct = percent(completedCount, total);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/khoa-hoc" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← {labels.nav.courses}
      </Link>

      <header className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
        <p className="mt-2 text-slate-600">{course.description}</p>
        <p className="mt-3 text-sm font-medium text-brand-700">
          {labels.common.lessonCount(total)}
          {session?.user && total > 0 && (
            <span className="ml-2 text-slate-500">
              · {labels.progress.completedLessons(completedCount, total)} · {pct}%
            </span>
          )}
        </p>
        {session?.user && total > 0 && (
          <div className="mt-3 h-2 max-w-sm overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </header>

      <ol className="mt-8 space-y-3">
        {course.lessons.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            Nội dung bài học đang được cập nhật.
          </li>
        )}
        {course.lessons.map((lesson) => {
          const done = completedIds.has(lesson.id);
          return (
            <li key={lesson.id}>
              <Link
                href={`/khoa-hoc/${course.slug}/${lesson.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-semibold ${
                    done ? "bg-emerald-100 text-emerald-700" : "bg-brand-50 text-brand-700"
                  }`}
                >
                  {done ? "✓" : lesson.order}
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                    {labels.common.lesson} {lesson.order}
                    {done && (
                      <span className="ml-2 text-emerald-600">
                        {labels.progress.completed}
                      </span>
                    )}
                  </span>
                  <span className="block font-semibold text-slate-900 group-hover:text-brand-700">
                    {lesson.title}
                  </span>
                </span>
                <span className="text-brand-500 transition group-hover:translate-x-0.5">→</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
