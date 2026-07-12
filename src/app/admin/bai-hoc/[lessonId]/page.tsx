import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { LessonForm } from "@/components/admin/LessonForm";
import {
  LessonContentAdmin,
  type GrammarItem,
  type DialogueItem,
  type QuestionItem,
} from "@/components/admin/LessonContentAdmin";

type Props = { params: Promise<{ lessonId: string }> };

export const metadata: Metadata = { title: "Soạn bài học" };

export default async function AdminLessonPage({ params }: Props) {
  const { lessonId } = await params;
  await requireAdmin(`/admin/bai-hoc/${lessonId}`);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      vocabulary: { orderBy: { order: "asc" } },
      grammar: { orderBy: { order: "asc" } },
      dialogues: { orderBy: { order: "asc" } },
      quizQuestions: { orderBy: { order: "asc" } },
    },
  });
  if (!lesson) notFound();

  const grammar: GrammarItem[] = lesson.grammar.map((g) => ({
    id: g.id,
    pattern: g.pattern,
    explanation: g.explanation,
    examples: (g.examples as unknown as { kr: string; vi: string }[]) ?? [],
    order: g.order,
  }));
  const dialogues: DialogueItem[] = lesson.dialogues.map((d) => ({
    id: d.id,
    title: d.title,
    lines: (d.lines as unknown as { speaker: string; kr: string; vi: string }[]) ?? [],
    order: d.order,
  }));
  const questions: QuestionItem[] = lesson.quizQuestions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: (q.options as unknown as string[]) ?? [],
    answer: q.answer,
    explanation: q.explanation,
    order: q.order,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href={`/admin/khoa-hoc/${lesson.course.id}`}
        className="text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        ← {lesson.course.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">
          Soạn bài: {lesson.title}
        </h1>
        <Link
          href={`/khoa-hoc/${lesson.course.slug}/${lesson.slug}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Xem trang công khai →
        </Link>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Thông tin bài học
      </h2>
      <div className="mt-2">
        <LessonForm
          courseId={lesson.course.id}
          lesson={{
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            order: lesson.order,
          }}
        />
      </div>

      <LessonContentAdmin
        lessonId={lesson.id}
        vocab={lesson.vocabulary}
        grammar={grammar}
        dialogues={dialogues}
        questions={questions}
      />
    </div>
  );
}
