import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { labels } from "@/lib/labels";
import { CourseForm } from "@/components/admin/CourseForm";
import { LessonForm } from "@/components/admin/LessonForm";
import { DeleteButton } from "@/components/admin/ui";
import { deleteLesson } from "@/actions/admin/lessons";

const A = labels.admin;

type Props = { params: Promise<{ courseId: string }> };

export const metadata: Metadata = { title: A.course };

export default async function AdminCoursePage({ params }: Props) {
  const { courseId } = await params;
  await requireAdmin(`/admin/khoa-hoc/${courseId}`);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/admin/khoa-hoc" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← {A.courses}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        {A.course}: {course.title}
      </h1>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Thông tin khóa học
      </h2>
      <div className="mt-2">
        <CourseForm
          course={{
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description,
            order: course.order,
          }}
        />
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Thêm bài học
      </h2>
      <div className="mt-2">
        <LessonForm courseId={course.id} />
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {A.lessons} ({course.lessons.length})
      </h2>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">{A.order}</th>
              <th className="px-4 py-3 font-semibold">{A.title}</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {course.lessons.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-400">{l.order}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{l.title}</td>
                <td className="px-4 py-3 text-slate-500">{l.slug}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/bai-hoc/${l.id}`}
                      className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                    >
                      {A.openEditor}
                    </Link>
                    <DeleteButton
                      id={l.id}
                      action={deleteLesson}
                      confirmText={A.confirmDeleteLesson}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {course.lessons.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Chưa có bài học nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
