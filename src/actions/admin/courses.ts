"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { courseSchema } from "@/lib/validation/admin";
import { zodFieldErrors, type AdminFormState } from "@/lib/admin-form";

function revalidateCoursePages(slug?: string) {
  revalidatePath("/");
  revalidatePath("/khoa-hoc");
  revalidatePath("/tien-do");
  revalidatePath("/admin");
  revalidatePath("/admin/khoa-hoc");
  if (slug) revalidatePath(`/khoa-hoc/${slug}`);
}

/** Tạo mới hoặc cập nhật khóa học (id ẩn trong form khi sửa). */
export async function saveCourse(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    order: formData.get("order"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const id = formData.get("id");

  try {
    if (typeof id === "string" && id) {
      const updated = await prisma.course.update({
        where: { id },
        data: parsed.data,
      });
      revalidateCoursePages(updated.slug);
      revalidatePath(`/admin/khoa-hoc/${id}`);
    } else {
      await prisma.course.create({ data: parsed.data });
      revalidateCoursePages(parsed.data.slug);
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { fieldErrors: { slug: "Slug này đã được sử dụng" } };
    }
    throw e;
  }

  return { success: true };
}

/** Xóa khóa học (cascade: bài học, từ vựng, thẻ, câu hỏi...). */
export async function deleteCourse(courseId: string): Promise<void> {
  await requireAdmin();
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return;

  await prisma.course.delete({ where: { id: courseId } });
  revalidateCoursePages(course.slug);
  redirect("/admin/khoa-hoc");
}
