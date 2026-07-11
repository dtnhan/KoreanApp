import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getCoursesWithProgress } from "@/lib/progress";
import { labels } from "@/lib/labels";

export const metadata: Metadata = { title: labels.progress.dashboardTitle };

export default async function ProgressPage() {
  const user = await requireUser("/tien-do");
  const courses = await getCoursesWithProgress(user.id);

  const totalCompleted = courses.reduce(
    (sum, c) => sum + (c.progress?.completed ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">
        {labels.progress.dashboardTitle}
      </h1>
      <p className="mt-2 text-slate-600">
        {labels.auth.greeting(user.name ?? user.email ?? "bạn")}{" "}
        {labels.progress.totalCompleted(totalCompleted)}.
      </p>

      <div className="mt-8 space-y-4">
        {courses.map((c) => {
          const completed = c.progress?.completed ?? 0;
          const pct = c.progress?.percent ?? 0;
          return (
            <Link
              key={c.id}
              href={`/khoa-hoc/${c.slug}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-900 group-hover:text-brand-700">
                    {c.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {c.lessonCount > 0
                      ? `${labels.progress.completedLessons(completed, c.lessonCount)} · ${pct}%`
                      : "Nội dung đang được cập nhật"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                    pct === 100 && c.lessonCount > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-brand-50 text-brand-700"
                  }`}
                >
                  {pct}%
                </span>
              </div>
              {c.lessonCount > 0 && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct === 100 ? "bg-emerald-500" : "bg-brand-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
