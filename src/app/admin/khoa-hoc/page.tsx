import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { labels } from "@/lib/labels";
import { CourseForm } from "@/components/admin/CourseForm";
import { DeleteButton } from "@/components/admin/ui";
import { deleteCourse } from "@/actions/admin/courses";

const A = labels.admin;

export const metadata: Metadata = { title: A.courses };

export default async function AdminCoursesPage() {
  await requireAdmin("/admin/khoa-hoc");

  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { lessons: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/admin" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        {A.backToAdmin}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{A.courses}</h1>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {A.add}
      </h2>
      <div className="mt-2">
        <CourseForm />
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Danh sách khóa học
      </h2>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">{A.order}</th>
              <th className="px-4 py-3 font-semibold">{A.title}</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">{A.lessons}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-400">{c.order}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{c.title}</td>
                <td className="px-4 py-3 text-slate-500">{c.slug}</td>
                <td className="px-4 py-3 text-slate-500">{c._count.lessons}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/khoa-hoc/${c.id}`}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                    >
                      {A.edit}
                    </Link>
                    <DeleteButton
                      id={c.id}
                      action={deleteCourse}
                      confirmText={A.confirmDeleteCourse}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
