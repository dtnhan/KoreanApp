import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(1, "Slug không được để trống")
  .max(80, "Slug tối đa 80 ký tự")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang");

const orderNum = z.coerce
  .number()
  .int("Thứ tự phải là số nguyên")
  .min(1, "Thứ tự tối thiểu là 1")
  .max(999, "Thứ tự tối đa 999");

export const courseSchema = z.object({
  title: z.string().trim().min(1, "Tiêu đề không được để trống").max(120),
  slug,
  description: z.string().trim().min(1, "Mô tả không được để trống").max(500),
  order: orderNum,
});

export const lessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(1, "Tiêu đề không được để trống").max(160),
  slug,
  order: orderNum,
});

export const vocabSchema = z.object({
  lessonId: z.string().min(1),
  korean: z.string().trim().min(1, "Từ tiếng Hàn không được để trống").max(120),
  romanization: z.string().trim().max(160).optional().or(z.literal("")),
  vietnamese: z.string().trim().min(1, "Nghĩa tiếng Việt không được để trống").max(240),
  exampleKr: z.string().trim().max(500).optional().or(z.literal("")),
  exampleVi: z.string().trim().max(500).optional().or(z.literal("")),
  audioUrl: z.url("URL không hợp lệ").max(500).optional().or(z.literal("")),
  order: orderNum,
});

export const examplePair = z.object({
  kr: z.string().trim().min(1, "Câu tiếng Hàn không được để trống").max(500),
  vi: z.string().trim().min(1, "Bản dịch không được để trống").max(500),
});

export const grammarSchema = z.object({
  lessonId: z.string().min(1),
  pattern: z.string().trim().min(1, "Cấu trúc không được để trống").max(200),
  explanation: z.string().trim().min(1, "Giải thích không được để trống").max(4000),
  examples: z.array(examplePair).min(1, "Cần ít nhất 1 cặp ví dụ"),
  order: orderNum,
});

export const dialogueLine = z.object({
  speaker: z.string().trim().min(1, "Tên người nói không được để trống").max(60),
  kr: z.string().trim().min(1, "Câu tiếng Hàn không được để trống").max(500),
  vi: z.string().trim().min(1, "Bản dịch không được để trống").max(500),
});

export const dialogueSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().trim().min(1, "Tiêu đề không được để trống").max(160),
  lines: z.array(dialogueLine).min(1, "Cần ít nhất 1 dòng hội thoại"),
  order: orderNum,
});

export const questionSchema = z
  .object({
    lessonId: z.string().min(1),
    type: z.enum(["MCQ_KR_VN", "MCQ_VN_KR", "FILL_BLANK"]),
    prompt: z.string().trim().min(1, "Câu hỏi không được để trống").max(1000),
    options: z.array(z.string().trim().min(1, "Lựa chọn không được để trống").max(240)),
    answer: z.string().trim().min(1, "Đáp án không được để trống").max(240),
    explanation: z.string().trim().max(1000).optional().or(z.literal("")),
    order: orderNum,
  })
  .superRefine((data, ctx) => {
    if (data.type === "FILL_BLANK") return;
    if (data.options.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Câu trắc nghiệm cần ít nhất 2 lựa chọn",
      });
      return;
    }
    if (!data.options.includes(data.answer)) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message: "Đáp án phải trùng với một trong các lựa chọn",
      });
    }
  });
