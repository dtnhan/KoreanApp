import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getCoursesWithProgress } from "@/lib/progress";
import { prisma } from "@/lib/prisma";
import { labels } from "@/lib/labels";

export const metadata: Metadata = { title: labels.progress.dashboardTitle };

const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export default async function ProgressPage() {
  const user = await requireUser("/tien-do");
  const courses = await getCoursesWithProgress(user.id);

  const totalCompleted = courses.reduce(
    (sum, c) => sum + (c.progress?.completed ?? 0),
    0,
  );

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      lesson: {
        select: {
          title: true,
          slug: true,
          course: { select: { slug: true } },
        },
      },
    },
  });

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

      {/* Lịch sử làm bài */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">{labels.quiz.history}</h2>
        {attempts.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            {labels.quiz.historyEmpty}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Bài học</th>
                  <th className="px-4 py-3 font-semibold">Điểm</th>
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                  return (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/khoa-hoc/${a.lesson.course.slug}/${a.lesson.slug}/kiem-tra`}
                          className="font-medium text-slate-900 hover:text-brand-700"
                        >
                          {a.lesson.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            pct >= 80
                              ? "bg-emerald-100 text-emerald-700"
                              : pct >= 50
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {a.score}/{a.total}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {dateFmt.format(a.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
