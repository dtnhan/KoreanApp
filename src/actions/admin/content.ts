"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  vocabSchema,
  grammarSchema,
  dialogueSchema,
  questionSchema,
} from "@/lib/validation/admin";
import {
  zodFieldErrors,
  parseJsonArray,
  type AdminFormState,
} from "@/lib/admin-form";
import { buildQuestions } from "@/lib/question-gen";
import { buildDialogue } from "@/lib/dialogue-gen";

async function revalidateLessonContent(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { slug: true, course: { select: { slug: true } } },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/bai-hoc/${lessonId}`);
  if (lesson) {
    revalidatePath(`/khoa-hoc/${lesson.course.slug}/${lesson.slug}`);
    revalidatePath(`/khoa-hoc/${lesson.course.slug}/${lesson.slug}/kiem-tra`);
  }
  revalidatePath("/on-tap");
}

function emptyToNull(v: string | undefined): string | null {
  return v ? v : null;
}

// ---------------- Từ vựng ----------------

export async function saveVocab(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = vocabSchema.safeParse({
    lessonId: formData.get("lessonId"),
    korean: formData.get("korean"),
    romanization: formData.get("romanization") ?? "",
    vietnamese: formData.get("vietnamese"),
    exampleKr: formData.get("exampleKr") ?? "",
    exampleVi: formData.get("exampleVi") ?? "",
    audioUrl: formData.get("audioUrl") ?? "",
    order: formData.get("order"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  const data = {
    lessonId: d.lessonId,
    korean: d.korean,
    romanization: emptyToNull(d.romanization),
    vietnamese: d.vietnamese,
    exampleKr: emptyToNull(d.exampleKr),
    exampleVi: emptyToNull(d.exampleVi),
    audioUrl: emptyToNull(d.audioUrl),
    order: d.order,
  };

  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await prisma.vocabularyItem.update({ where: { id }, data });
  } else {
    await prisma.vocabularyItem.create({ data });
  }

  await revalidateLessonContent(d.lessonId);
  return { success: true };
}

export async function deleteVocab(id: string): Promise<void> {
  await requireAdmin();
  const item = await prisma.vocabularyItem.findUnique({
    where: { id },
    select: { lessonId: true },
  });
  if (!item) return;
  await prisma.vocabularyItem.delete({ where: { id } });
  await revalidateLessonContent(item.lessonId);
}

// ---------------- Ngữ pháp ----------------

export async function saveGrammar(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = grammarSchema.safeParse({
    lessonId: formData.get("lessonId"),
    pattern: formData.get("pattern"),
    explanation: formData.get("explanation"),
    examples: parseJsonArray(formData.get("examplesJson")),
    order: formData.get("order"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  const data = {
    lessonId: d.lessonId,
    pattern: d.pattern,
    explanation: d.explanation,
    examples: d.examples,
    order: d.order,
  };

  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await prisma.grammarPoint.update({ where: { id }, data });
  } else {
    await prisma.grammarPoint.create({ data });
  }

  await revalidateLessonContent(d.lessonId);
  return { success: true };
}

export async function deleteGrammar(id: string): Promise<void> {
  await requireAdmin();
  const item = await prisma.grammarPoint.findUnique({
    where: { id },
    select: { lessonId: true },
  });
  if (!item) return;
  await prisma.grammarPoint.delete({ where: { id } });
  await revalidateLessonContent(item.lessonId);
}

// ---------------- Hội thoại ----------------

export async function saveDialogue(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = dialogueSchema.safeParse({
    lessonId: formData.get("lessonId"),
    title: formData.get("title"),
    lines: parseJsonArray(formData.get("linesJson")),
    order: formData.get("order"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  const data = {
    lessonId: d.lessonId,
    title: d.title,
    lines: d.lines,
    order: d.order,
  };

  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await prisma.dialogue.update({ where: { id }, data });
  } else {
    await prisma.dialogue.create({ data });
  }

  await revalidateLessonContent(d.lessonId);
  return { success: true };
}

export async function deleteDialogue(id: string): Promise<void> {
  await requireAdmin();
  const item = await prisma.dialogue.findUnique({
    where: { id },
    select: { lessonId: true },
  });
  if (!item) return;
  await prisma.dialogue.delete({ where: { id } });
  await revalidateLessonContent(item.lessonId);
}

// ---------------- Câu hỏi ----------------

export async function saveQuestion(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const type = formData.get("type");
  const rawOptions = [
    formData.get("option1"),
    formData.get("option2"),
    formData.get("option3"),
    formData.get("option4"),
  ]
    .map((o) => (typeof o === "string" ? o.trim() : ""))
    .filter((o) => o !== "");

  const parsed = questionSchema.safeParse({
    lessonId: formData.get("lessonId"),
    type,
    prompt: formData.get("prompt"),
    options: type === "FILL_BLANK" ? [] : rawOptions,
    answer: formData.get("answer"),
    explanation: formData.get("explanation") ?? "",
    order: formData.get("order"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  const data = {
    lessonId: d.lessonId,
    type: d.type,
    prompt: d.prompt,
    options: d.options,
    answer: d.answer,
    explanation: emptyToNull(d.explanation),
    order: d.order,
  };

  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await prisma.quizQuestion.update({ where: { id }, data });
  } else {
    await prisma.quizQuestion.create({ data });
  }

  await revalidateLessonContent(d.lessonId);
  return { success: true };
}

export async function deleteQuestion(id: string): Promise<void> {
  await requireAdmin();
  const item = await prisma.quizQuestion.findUnique({
    where: { id },
    select: { lessonId: true },
  });
  if (!item) return;
  await prisma.quizQuestion.delete({ where: { id } });
  await revalidateLessonContent(item.lessonId);
}

/**
 * Tự động sinh câu hỏi theo luật từ từ vựng + ngữ pháp của bài.
 * Câu mới nối tiếp sau câu có sẵn; câu trùng prompt bị bỏ qua.
 */
export async function generateQuestions(
  lessonId: string,
): Promise<{ created: number }> {
  await requireAdmin();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      vocabulary: {
        select: { korean: true, vietnamese: true, exampleKr: true, exampleVi: true },
      },
      grammar: { select: { pattern: true, examples: true } },
      quizQuestions: { select: { prompt: true } },
    },
  });
  if (!lesson) throw new Error("Không tìm thấy bài học");

  // Bài trước trong cùng khóa → pool ôn tập lũy tiến
  const priorLessons = await prisma.lesson.findMany({
    where: { courseId: lesson.courseId, order: { lt: lesson.order } },
    include: {
      vocabulary: {
        select: { korean: true, vietnamese: true, exampleKr: true, exampleVi: true },
      },
      grammar: { select: { pattern: true, examples: true } },
    },
  });

  const castGrammar = (gs: { pattern: string; examples: unknown }[]) =>
    gs.map((g) => ({
      pattern: g.pattern,
      examples: (g.examples as { kr: string; vi: string }[]) ?? [],
    }));

  const candidates = buildQuestions({
    vocab: lesson.vocabulary,
    grammar: castGrammar(lesson.grammar),
    reviewVocab: priorLessons.flatMap((l) => l.vocabulary),
    reviewGrammar: castGrammar(priorLessons.flatMap((l) => l.grammar)),
    existingPrompts: lesson.quizQuestions.map((q) => q.prompt),
  });

  const existingCount = lesson.quizQuestions.length;
  const valid: {
    lessonId: string;
    type: "MCQ_KR_VN" | "MCQ_VN_KR" | "FILL_BLANK";
    prompt: string;
    options: string[];
    answer: string;
    explanation: string | null;
    order: number;
  }[] = [];

  for (const c of candidates) {
    const parsed = questionSchema.safeParse({
      lessonId,
      type: c.type,
      prompt: c.prompt,
      options: c.options,
      answer: c.answer,
      explanation: c.explanation ?? "",
      order: existingCount + valid.length + 1,
    });
    if (!parsed.success) continue; // câu không hợp lệ → âm thầm bỏ, không throw
    const d = parsed.data;
    valid.push({
      lessonId: d.lessonId,
      type: d.type,
      prompt: d.prompt,
      options: d.options,
      answer: d.answer,
      explanation: emptyToNull(d.explanation),
      order: d.order,
    });
  }

  if (valid.length > 0) {
    await prisma.quizQuestion.createMany({ data: valid });
    await revalidateLessonContent(lessonId);
  }

  return { created: valid.length };
}

/**
 * Sinh một hội thoại theo khuôn mẫu an toàn từ danh từ của bài
 * (thiếu thì lấy thêm từ các bài trước). Không bao giờ sai trợ từ.
 */
export async function generateDialogue(
  lessonId: string,
): Promise<{ created: number }> {
  await requireAdmin();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      vocabulary: { select: { korean: true, vietnamese: true } },
      dialogues: { select: { title: true } },
    },
  });
  if (!lesson) throw new Error("Không tìm thấy bài học");

  const priorLessons = await prisma.lesson.findMany({
    where: { courseId: lesson.courseId, order: { lt: lesson.order } },
    include: { vocabulary: { select: { korean: true, vietnamese: true } } },
  });

  const dialogue = buildDialogue({
    vocab: lesson.vocabulary,
    reviewVocab: priorLessons.flatMap((l) => l.vocabulary),
    existingTitles: lesson.dialogues.map((d) => d.title),
  });
  if (!dialogue) return { created: 0 };

  // Validate qua dialogueSchema sẵn có (title + lines {speaker,kr,vi} + order)
  const parsed = dialogueSchema.safeParse({
    lessonId,
    title: dialogue.title,
    lines: dialogue.lines,
    order: lesson.dialogues.length + 1,
  });
  if (!parsed.success) return { created: 0 };

  await prisma.dialogue.create({
    data: {
      lessonId,
      title: parsed.data.title,
      lines: parsed.data.lines,
      order: parsed.data.order,
    },
  });
  await revalidateLessonContent(lessonId);

  return { created: 1 };
}
