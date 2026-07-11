"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

export type QuizAnswerInput = { questionId: string; value: string };

export type GradedQuestion = {
  questionId: string;
  prompt: string;
  options: string[];
  given: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string | null;
};

export type QuizResult = {
  score: number;
  total: number;
  detail: GradedQuestion[];
};

/** Chuẩn hóa đáp án điền khuyết: bỏ khoảng trắng thừa, không phân biệt hoa thường. */
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Chấm bài phía server — client không bao giờ nhận đáp án trước khi nộp. */
export async function submitQuiz(
  lessonId: string,
  answers: QuizAnswerInput[],
): Promise<QuizResult> {
  const user = await requireUser();

  const questions = await prisma.quizQuestion.findMany({
    where: { lessonId },
    orderBy: { order: "asc" },
  });
  if (questions.length === 0) {
    throw new Error("Bài học này chưa có câu hỏi kiểm tra");
  }

  const givenByQuestion = new Map(answers.map((a) => [a.questionId, a.value]));

  const detail: GradedQuestion[] = questions.map((q) => {
    const given = givenByQuestion.get(q.id) ?? "";
    const correct =
      q.type === "FILL_BLANK"
        ? normalize(given) === normalize(q.answer)
        : given === q.answer;
    return {
      questionId: q.id,
      prompt: q.prompt,
      options: (q.options as unknown as string[]) ?? [],
      given,
      correct,
      correctAnswer: q.answer,
      explanation: q.explanation,
    };
  });

  const score = detail.filter((d) => d.correct).length;

  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      lessonId,
      score,
      total: questions.length,
      answers: detail.map((d) => ({
        questionId: d.questionId,
        given: d.given,
        correct: d.correct,
        correctAnswer: d.correctAnswer,
      })),
    },
  });

  revalidatePath("/tien-do");

  return { score, total: questions.length, detail };
}
