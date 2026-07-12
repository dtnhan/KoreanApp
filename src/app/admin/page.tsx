import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { labels } from "@/lib/labels";

const A = labels.admin;

export const metadata: Metadata = { title: labels.nav.admin };

export default async function AdminPage() {
  const user = await requireAdmin("/admin");

  const [courses, lessons, vocab, questions, users, attempts] = await Promise.all([
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.vocabularyItem.count(),
    prisma.quizQuestion.count(),
    prisma.user.count(),
    prisma.quizAttempt.count(),
  ]);

  const stats = [
    { label: A.course, value: courses },
    { label: A.lessons, value: lessons },
    { label: A.vocab, value: vocab },
    { label: A.questions, value: questions },
    { label: A.users, value: users },
    { label: A.attempts, value: attempts },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{A.areaTitle}</h1>
      <p className="mt-1 text-slate-600">{labels.auth.greeting(user.name ?? "Admin")}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-brand-600">{s.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/khoa-hoc"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
        >
          <h2 className="font-semibold text-slate-900 group-hover:text-brand-700">
            {A.courses} →
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tạo, sửa, xóa khóa học và quản lý danh sách bài học của từng khóa.
          </p>
        </Link>
        <Link
          href="/khoa-hoc"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
        >
          <h2 className="font-semibold text-slate-900 group-hover:text-brand-700">
            Xem trang công khai →
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Kiểm tra nội dung hiển thị với học viên.
          </p>
        </Link>
      </div>
    </div>
  );
}
