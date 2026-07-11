import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { labels } from "@/lib/labels";
import { QuizRunner } from "@/components/QuizRunner";

type Props = { params: Promise<{ courseSlug: string; lessonSlug: string }> };

async function getLesson(courseSlug: string, lessonSlug: string) {
  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) return null;
  const lesson = await prisma.lesson.findUnique({
    where: { courseId_slug: { courseId: course.id, slug: lessonSlug } },
    include: {
      quizQuestions: {
        orderBy: { order: "asc" },
        // KHÔNG lấy answer/explanation — đáp án chỉ tồn tại phía server
        select: { id: true, type: true, prompt: true, options: true },
      },
    },
  });
  if (!lesson) return null;
  return { course, lesson };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug, lessonSlug } = await params;
  const data = await getLesson(courseSlug, lessonSlug);
  if (!data) return { title: labels.common.notFound };
  return { title: `${labels.quiz.title} — ${data.lesson.title}` };
}

export default async function QuizPage({ params }: Props) {
  const { courseSlug, lessonSlug } = await params;
  await requireUser(`/khoa-hoc/${courseSlug}/${lessonSlug}/kiem-tra`);

  const data = await getLesson(courseSlug, lessonSlug);
  if (!data) notFound();
  const { course, lesson } = data;
  const lessonPath = `/khoa-hoc/${course.slug}/${lesson.slug}`;

  const questions = lesson.quizQuestions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: (q.options as unknown as string[]) ?? [],
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={lessonPath} className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← {lesson.title}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">
        {labels.quiz.title}: {lesson.title}
      </h1>

      {questions.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          {labels.quiz.noQuestions}
        </div>
      ) : (
        <QuizRunner lessonId={lesson.id} lessonPath={lessonPath} questions={questions} />
      )}
    </div>
  );
}
