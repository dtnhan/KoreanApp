"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { lessonSchema } from "@/lib/validation/admin";
import { zodFieldErrors, type AdminFormState } from "@/lib/admin-form";

async function revalidateLessonPages(courseId: string, lessonSlug?: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });
  revalidatePath("/");
  revalidatePath("/khoa-hoc");
  revalidatePath("/tien-do");
  revalidatePath("/admin");
  revalidatePath(`/admin/khoa-hoc/${courseId}`);
  if (course) {
    revalidatePath(`/khoa-hoc/${course.slug}`);
    if (lessonSlug) revalidatePath(`/khoa-hoc/${course.slug}/${lessonSlug}`);
  }
}

/** Tạo mới hoặc cập nhật bài học (id ẩn trong form khi sửa). */
export async function saveLesson(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = lessonSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    order: formData.get("order"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const id = formData.get("id");

  try {
    if (typeof id === "string" && id) {
      await prisma.lesson.update({
        where: { id },
        data: {
          title: parsed.data.title,
          slug: parsed.data.slug,
          order: parsed.data.order,
        },
      });
      revalidatePath(`/admin/bai-hoc/${id}`);
    } else {
      await prisma.lesson.create({ data: parsed.data });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        error: "Slug hoặc thứ tự này đã tồn tại trong khóa học",
      };
    }
    throw e;
  }

  await revalidateLessonPages(parsed.data.courseId, parsed.data.slug);
  return { success: true };
}

/** Xóa bài học (cascade nội dung + thẻ + lượt làm bài). */
export async function deleteLesson(lessonId: string): Promise<void> {
  await requireAdmin();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true, slug: true },
  });
  if (!lesson) return;

  await prisma.lesson.delete({ where: { id: lessonId } });
  await revalidateLessonPages(lesson.courseId, lesson.slug);
  revalidatePath("/on-tap");
}
