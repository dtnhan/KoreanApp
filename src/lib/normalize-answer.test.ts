import { describe, it, expect } from "vitest";
import { normalizeAnswer } from "./normalize-answer";

describe("normalizeAnswer", () => {
  it("cắt khoảng trắng đầu/cuối và chữ thường", () => {
    expect(normalizeAnswer("  Xin Chào  ")).toBe("xin chào");
  });

  it("gộp nhiều khoảng trắng liên tiếp thành một", () => {
    expect(normalizeAnswer("안녕   하세요")).toBe("안녕 하세요");
  });

  it("giữ nguyên dấu tiếng Việt (chỉ NFC-normalize, không bỏ dấu)", () => {
    expect(normalizeAnswer("Cảm ơn")).toBe("cảm ơn");
  });

  it("hai chuỗi khác dạng dựng sẵn (NFC/NFD) coi là bằng nhau sau chuẩn hóa", () => {
    const nfc = "Cảm ơn".normalize("NFC");
    const nfd = "Cảm ơn".normalize("NFD");
    expect(normalizeAnswer(nfc)).toBe(normalizeAnswer(nfd));
  });

  it("chuỗi tiếng Hàn với khoảng trắng thừa", () => {
    expect(normalizeAnswer("  학교   에   가요  ")).toBe("학교 에 가요");
  });
});
