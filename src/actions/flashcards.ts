"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { schedule, type Rating } from "@/lib/srs";

export type AddToDeckResult = { added: number; total: number };

/** Thêm toàn bộ từ vựng của một bài học vào bộ thẻ của người dùng (idempotent). */
export async function addLessonToDeck(lessonId: string): Promise<AddToDeckResult> {
  const user = await requireUser();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: { select: { slug: true } },
      vocabulary: { select: { id: true } },
    },
  });
  if (!lesson) throw new Error("Không tìm thấy bài học");

  const result = await prisma.flashcard.createMany({
    data: lesson.vocabulary.map((v) => ({
      userId: user.id,
      vocabularyItemId: v.id,
    })),
    skipDuplicates: true,
  });

  revalidatePath(`/khoa-hoc/${lesson.course.slug}/${lesson.slug}`);
  revalidatePath("/on-tap");

  return { added: result.count, total: lesson.vocabulary.length };
}

export type ReviewResult = {
  cardId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueDate: string;
};

const VALID_RATINGS: Rating[] = ["AGAIN", "HARD", "GOOD", "EASY"];

/** Ghi nhận một lượt ôn thẻ và tính lịch ôn tiếp theo (SM-2). */
export async function reviewCard(
  cardId: string,
  rating: Rating,
): Promise<ReviewResult> {
  const user = await requireUser();

  if (!VALID_RATINGS.includes(rating)) {
    throw new Error("Đánh giá không hợp lệ");
  }

  const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
  if (!card || card.userId !== user.id) {
    throw new Error("Không tìm thấy thẻ");
  }

  const next = schedule(
    {
      easeFactor: card.easeFactor,
      intervalDays: card.intervalDays,
      repetitions: card.repetitions,
      lapses: card.lapses,
    },
    rating,
  );

  const updated = await prisma.flashcard.update({
    where: { id: card.id },
    data: {
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueDate: next.dueDate,
      lastReviewedAt: next.lastReviewedAt,
    },
  });

  revalidatePath("/on-tap");

  return {
    cardId: updated.id,
    easeFactor: updated.easeFactor,
    intervalDays: updated.intervalDays,
    repetitions: updated.repetitions,
    lapses: updated.lapses,
    dueDate: updated.dueDate.toISOString(),
  };
}
