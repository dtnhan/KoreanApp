import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const customCardSchema = z.object({
  korean: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập từ tiếng Hàn")
    .max(200, "Từ tiếng Hàn tối đa 200 ký tự"),
  romanization: optionalText(200),
  vietnamese: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nghĩa tiếng Việt")
    .max(300, "Nghĩa tiếng Việt tối đa 300 ký tự"),
  exampleKr: optionalText(500),
  exampleVi: optionalText(500),
});

export type CustomCardInput = z.infer<typeof customCardSchema>;
