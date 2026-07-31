// Chuẩn hóa câu trả lời để so sánh khoan dung (bỏ khoảng trắng thừa, không phân biệt hoa/thường).

export function normalizeAnswer(s: string): string {
  return s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
}
