"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { customCardSchema } from "@/lib/validation/custom-card";
import { zodFieldErrors, type AdminFormState } from "@/lib/admin-form";

function emptyToNull(v: string | undefined): string | null {
  return v ? v : null;
}

function revalidate() {
  revalidatePath("/the-cua-toi");
  revalidatePath("/on-tap");
}

/** Tạo một thẻ ghi nhớ tự tạo, đưa thẳng vào hàng đợi SRS của người dùng. */
export async function createCustomCard(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const user = await requireUser();

  const parsed = customCardSchema.safeParse({
    korean: formData.get("korean"),
    romanization: formData.get("romanization") ?? "",
    vietnamese: formData.get("vietnamese"),
    exampleKr: formData.get("exampleKr") ?? "",
    exampleVi: formData.get("exampleVi") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  await prisma.flashcard.create({
    data: {
      userId: user.id,
      vocabularyItemId: null,
      customKorean: d.korean,
      customRomanization: emptyToNull(d.romanization),
      customVietnamese: d.vietnamese,
      customExampleKr: emptyToNull(d.exampleKr),
      customExampleVi: emptyToNull(d.exampleVi),
      // Các trường SRS dùng default: dueDate = now → hiện ngay trong hàng đợi hôm nay
    },
  });

  revalidate();
  return { success: true };
}

/** Chỉ sửa NỘI DUNG thẻ tự tạo của chính người dùng (không đụng vào trạng thái SRS). */
export async function updateCustomCard(
  id: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const user = await requireUser();

  const card = await prisma.flashcard.findUnique({ where: { id } });
  if (!card || card.userId !== user.id || card.vocabularyItemId !== null) {
    return { error: "Không tìm thấy thẻ hoặc bạn không có quyền sửa thẻ này" };
  }

  const parsed = customCardSchema.safeParse({
    korean: formData.get("korean"),
    romanization: formData.get("romanization") ?? "",
    vietnamese: formData.get("vietnamese"),
    exampleKr: formData.get("exampleKr") ?? "",
    exampleVi: formData.get("exampleVi") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  await prisma.flashcard.update({
    where: { id },
    data: {
      customKorean: d.korean,
      customRomanization: emptyToNull(d.romanization),
      customVietnamese: d.vietnamese,
      customExampleKr: emptyToNull(d.exampleKr),
      customExampleVi: emptyToNull(d.exampleVi),
    },
  });

  revalidate();
  return { success: true };
}

/** Xóa một thẻ tự tạo của chính người dùng. */
export async function deleteCustomCard(id: string): Promise<void> {
  const user = await requireUser();

  const card = await prisma.flashcard.findUnique({ where: { id } });
  if (!card || card.userId !== user.id || card.vocabularyItemId !== null) {
    throw new Error("Không tìm thấy thẻ hoặc bạn không có quyền xóa thẻ này");
  }

  await prisma.flashcard.delete({ where: { id } });
  revalidate();
}
