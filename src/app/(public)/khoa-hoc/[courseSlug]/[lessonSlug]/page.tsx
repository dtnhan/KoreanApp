import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { labels } from "@/lib/labels";
import { LessonTabs, type GrammarExample, type DialogueLine } from "@/components/LessonTabs";
import { LessonActions } from "@/components/LessonActions";

type Props = { params: Promise<{ courseSlug: string; lessonSlug: string }> };

async function getLesson(courseSlug: string, lessonSlug: string) {
  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) return null;
  const lesson = await prisma.lesson.findUnique({
    where: { courseId_slug: { courseId: course.id, slug: lessonSlug } },
    include: {
      vocabulary: { orderBy: { order: "asc" } },
      grammar: { orderBy: { order: "asc" } },
      dialogues: { orderBy: { order: "asc" } },
    },
  });
  if (!lesson) return null;
  return { course, lesson };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug, lessonSlug } = await params;
  const data = await getLesson(courseSlug, lessonSlug);
  if (!data) return { title: labels.common.notFound };
  return {
    title: `${labels.common.lesson} ${data.lesson.order}: ${data.lesson.title} | ${data.course.title}`,
    description: `Học ${data.lesson.title} trong khóa ${data.course.title}: từ vựng, ngữ pháp và hội thoại tiếng Hàn kèm bản dịch tiếng Việt.`,
  };
}

export default async function LessonPage({ params }: Props) {
  const { courseSlug, lessonSlug } = await params;
  const data = await getLesson(courseSlug, lessonSlug);
  if (!data) notFound();
  const { course, lesson } = data;

  const session = await auth();
  const isAuthed = !!session?.user;
  const initialCompleted =
    isAuthed &&
    !!(await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: { userId: session!.user.id, lessonId: lesson.id },
      },
    }));

  const lessonPath = `/khoa-hoc/${course.slug}/${lesson.slug}`;

  const vocab = lesson.vocabulary.map((v) => ({
    id: v.id,
    korean: v.korean,
    romanization: v.romanization,
    vietnamese: v.vietnamese,
    exampleKr: v.exampleKr,
    exampleVi: v.exampleVi,
    audioUrl: v.audioUrl,
  }));

  const grammar = lesson.grammar.map((g) => ({
    id: g.id,
    pattern: g.pattern,
    explanation: g.explanation,
    examples: (g.examples as unknown as GrammarExample[]) ?? [],
  }));

  const dialogues = lesson.dialogues.map((d) => ({
    id: d.id,
    title: d.title,
    lines: (d.lines as unknown as DialogueLine[]) ?? [],
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href={`/khoa-hoc/${course.slug}`}
        className="text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        ← {course.title}
      </Link>

      <header className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {labels.common.lesson} {lesson.order}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{lesson.title}</h1>
      </header>

      <div className="mt-6">
        <LessonActions
          lessonId={lesson.id}
          lessonPath={lessonPath}
          isAuthed={isAuthed}
          initialCompleted={initialCompleted}
        />
      </div>

      <LessonTabs
        vocab={vocab}
        grammar={grammar}
        dialogues={dialogues}
        lessonPath={lessonPath}
      />
    </div>
  );
}
