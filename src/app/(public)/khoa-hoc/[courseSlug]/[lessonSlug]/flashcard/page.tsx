import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { labels } from "@/lib/labels";
import { PracticeFlashcards } from "@/components/PracticeFlashcards";
import { FlashcardReviewer } from "@/components/FlashcardReviewer";

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
    description: `Ôn từ vựng bài ${data.lesson.title} (${data.course.title}) bằng flashcard.`,
  };
}

export default async function LessonFlashcardPage({ params }: Props) {
  const { courseSlug, lessonSlug } = await params;
  const data = await getLesson(courseSlug, lessonSlug);
  if (!data) notFound();
  const { course, lesson } = data;
  const lessonPath = `/khoa-hoc/${course.slug}/${lesson.slug}`;
  const flashcardPath = `${lessonPath}/flashcard`;

  const session = await auth();
  const F = labels.flashcard;

  const backLink = (
    <Link href={lessonPath} className="text-sm font-medium text-brand-600 hover:text-brand-700">
      ← {lesson.title}
    </Link>
  );

  if (lesson.vocabulary.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        {backLink}
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {F.practiceTitle}: {lesson.title}
        </h1>
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Bài học này chưa có từ vựng.
        </div>
      </div>
    );
  }

  // ---------- Đã đăng nhập: Ôn ghi nhớ ngắt quãng (SRS) ----------
  if (session?.user) {
    const userId = session.user.id;

    // Bảo đảm từ vựng của bài đã có trong bộ thẻ của người dùng (idempotent)
    await prisma.flashcard.createMany({
      data: lesson.vocabulary.map((v) => ({ userId, vocabularyItemId: v.id })),
      skipDuplicates: true,
    });

    const flashcards = await prisma.flashcard.findMany({
      where: { userId, vocabularyItem: { lessonId: lesson.id } },
      include: { vocabularyItem: true },
      orderBy: { vocabularyItem: { order: "asc" } },
    });

    const cards = flashcards.map((c) => ({
      id: c.id, // BẮT BUỘC là flashcard.id để reviewCard(cardId, rating) hoạt động
      korean: c.vocabularyItem?.korean ?? c.customKorean ?? "",
      romanization: c.vocabularyItem?.romanization ?? c.customRomanization ?? null,
      vietnamese: c.vocabularyItem?.vietnamese ?? c.customVietnamese ?? "",
      exampleKr: c.vocabularyItem?.exampleKr ?? c.customExampleKr ?? null,
      exampleVi: c.vocabularyItem?.exampleVi ?? c.customExampleVi ?? null,
      audioUrl: c.vocabularyItem?.audioUrl ?? null,
      exampleAudioUrl: c.vocabularyItem?.exampleAudioUrl ?? null,
    }));

    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        {backLink}
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {F.srsLessonTitle(lesson.title)}
        </h1>
        <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {F.srsSavedNote}{" "}
          <Link href="/on-tap" className="font-semibold underline">
            {F.srsSeeDue}
          </Link>
        </p>
        <FlashcardReviewer initialCards={cards} />
      </div>
    );
  }

  // ---------- Khách: Lật thẻ nhanh (không lưu) ----------
  const cards = lesson.vocabulary.map((v) => ({
    id: v.id,
    korean: v.korean,
    romanization: v.romanization,
    vietnamese: v.vietnamese,
    exampleKr: v.exampleKr,
    exampleVi: v.exampleVi,
    audioUrl: v.audioUrl,
    exampleAudioUrl: v.exampleAudioUrl,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {backLink}
      <h1 className="mt-3 text-2xl font-bold text-slate-900">
        {F.quickTitle(lesson.title)}
      </h1>
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {F.quickBanner}{" "}
        <Link
          href={`/dang-nhap?callbackUrl=${encodeURIComponent(flashcardPath)}`}
          className="font-semibold text-amber-900 underline"
        >
          {F.quickLogin}
        </Link>
      </div>
      <PracticeFlashcards cards={cards} lessonPath={lessonPath} />
    </div>
  );
}
