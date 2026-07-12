import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { labels } from "@/lib/labels";
import { PracticeFlashcards } from "@/components/PracticeFlashcards";

type Props = { params: Promise<{ courseSlug: string; lessonSlug: string }> };

async function getLesson(courseSlug: string, lessonSlug: string) {
  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) return null;
  const lesson = await prisma.lesson.findUnique({
    where: { courseId_slug: { courseId: course.id, slug: lessonSlug } },
    include: { vocabulary: { orderBy: { order: "asc" } } },
  });
  if (!lesson) return null;
  return { course, lesson };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug, lessonSlug } = await params;
  const data = await getLesson(courseSlug, lessonSlug);
  if (!data) return { title: labels.common.notFound };
  return {
    title: `${labels.flashcard.practiceTitle}: ${data.lesson.title} | ${data.course.title}`,
    description: `Luyện từ vựng bài ${data.lesson.title} (${data.course.title}) bằng flashcard, không cần đăng nhập.`,
  };
}

export default async function PracticeFlashcardPage({ params }: Props) {
  const { courseSlug, lessonSlug } = await params;
  const data = await getLesson(courseSlug, lessonSlug);
  if (!data) notFound();
  const { course, lesson } = data;
  const lessonPath = `/khoa-hoc/${course.slug}/${lesson.slug}`;

  const cards = lesson.vocabulary.map((v) => ({
    id: v.id,
    korean: v.korean,
    romanization: v.romanization,
    vietnamese: v.vietnamese,
    exampleKr: v.exampleKr,
    exampleVi: v.exampleVi,
    audioUrl: v.audioUrl,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={lessonPath} className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← {lesson.title}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">
        {labels.flashcard.practiceTitle}: {lesson.title}
      </h1>

      {cards.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Bài học này chưa có từ vựng.
        </div>
      ) : (
        <PracticeFlashcards cards={cards} lessonPath={lessonPath} />
      )}
    </div>
  );
}
