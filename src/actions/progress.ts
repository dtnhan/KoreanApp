"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

export type ToggleResult = { completed: boolean };

/** Bật/tắt trạng thái hoàn thành một bài học cho người dùng hiện tại. */
export async function toggleLessonComplete(lessonId: string): Promise<ToggleResult> {
  const user = await requireUser();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { slug: true } } },
  });
  if (!lesson) {
    throw new Error("Không tìm thấy bài học");
  }

  const key = { userId: user.id, lessonId };
  const existing = await prisma.userLessonProgress.findUnique({
    where: { userId_lessonId: key },
  });

  let completed: boolean;
  if (existing) {
    await prisma.userLessonProgress.delete({ where: { userId_lessonId: key } });
    completed = false;
  } else {
    await prisma.userLessonProgress.create({ data: key });
    completed = true;
  }

  revalidatePath(`/khoa-hoc/${lesson.course.slug}/${lesson.slug}`);
  revalidatePath(`/khoa-hoc/${lesson.course.slug}`);
  revalidatePath("/khoa-hoc");
  revalidatePath("/");
  revalidatePath("/tien-do");

  return { completed };
}
