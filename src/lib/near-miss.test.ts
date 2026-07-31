import { describe, it, expect } from "vitest";
import { particleTypo, hangulSpellingTypo, vietnameseToneTypo } from "./near-miss";

function seededRng(seed = 42): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const HANGUL_RE = /^[가-힣]$/;

describe("particleTypo", () => {
  it("책이에요 → đổi 이에요 thành 예요 (sai vì 책 có batchim)", () => {
    expect(particleTypo("책이에요")).toBe("책예요");
  });

  it("학교예요 → đổi 예요 thành 이에요 (sai vì 학교 không batchim)", () => {
    expect(particleTypo("학교예요")).toBe("학교이에요");
  });

  it("은/는 swap đúng vị trí đầu tiên", () => {
    expect(particleTypo("저는 학생이에요")).not.toBeNull();
    // "저는" chứa "는" (topic) — sẽ đổi thành "저은 학생이에요" HOẶC câu chứa "이에요"
    // sẽ được ưu tiên nếu xuất hiện sớm hơn/dài hơn; ở đây "는" xuất hiện ở index1,
    // "이에요" ở index4 → "는" thắng vì index nhỏ hơn.
    expect(particleTypo("저는 학생이에요")).toBe("저은 학생이에요");
  });

  it("이/가 swap", () => {
    expect(particleTypo("친구가 와요")).toBe("친구이 와요");
    expect(particleTypo("학생이 있어요")).toBe("학생가 있어요");
  });

  it("을/를 swap", () => {
    expect(particleTypo("책을 읽어요")).toBe("책를 읽어요");
    expect(particleTypo("사과를 먹어요")).toBe("사과을 먹어요");
  });

  it("chuỗi không có trợ từ nào khớp → null", () => {
    expect(particleTypo("안녕하세요")).toBeNull();
    expect(particleTypo("")).toBeNull();
  });

  it("kết quả luôn khác chuỗi gốc khi không null", () => {
    const inputs = ["책이에요", "학교예요", "친구가 와요", "사과를 먹어요"];
    for (const input of inputs) {
      const result = particleTypo(input);
      expect(result).not.toBeNull();
      expect(result).not.toBe(input);
    }
  });
});

describe("hangulSpellingTypo", () => {
  it("không có Hangul → null", () => {
    expect(hangulSpellingTypo("hello")).toBeNull();
    expect(hangulSpellingTypo("")).toBeNull();
    expect(hangulSpellingTypo("123")).toBeNull();
  });

  it("luôn trả về chuỗi cùng độ dài, khác chuỗi gốc", () => {
    const inputs = ["책", "학교", "안녕하세요", "감사합니다", "물", "학생"];
    for (const input of inputs) {
      for (let seed = 1; seed <= 8; seed++) {
        const result = hangulSpellingTypo(input, seededRng(seed));
        expect(result).not.toBeNull();
        expect(result!.length).toBe(input.length);
        expect(result).not.toBe(input);
      }
    }
  });

  it("mọi ký tự trong kết quả đều là Hangul hoàn chỉnh hợp lệ ở các vị trí vốn là Hangul", () => {
    const input = "안녕하세요";
    for (let seed = 1; seed <= 20; seed++) {
      const result = hangulSpellingTypo(input, seededRng(seed))!;
      for (let i = 0; i < result.length; i++) {
        const code = result.charCodeAt(i);
        const origCode = input.charCodeAt(i);
        if (code === origCode) continue; // ký tự không đổi
        // ký tự đã đổi phải là Hangul hoàn chỉnh (không phải jamo rời/ký tự lỗi)
        expect(HANGUL_RE.test(result[i])).toBe(true);
        expect(code).toBeGreaterThanOrEqual(0xac00);
        expect(code).toBeLessThanOrEqual(0xd7a3);
      }
    }
  });

  it("chỉ đổi đúng 1 ký tự", () => {
    const input = "안녕하세요";
    for (let seed = 1; seed <= 10; seed++) {
      const result = hangulSpellingTypo(input, seededRng(seed))!;
      let diffCount = 0;
      for (let i = 0; i < input.length; i++) {
        if (input[i] !== result[i]) diffCount++;
      }
      expect(diffCount).toBe(1);
    }
  });
});

describe("vietnameseToneTypo", () => {
  it("chuỗi không dấu thanh nào → null", () => {
    expect(vietnameseToneTypo("toi")).toBeNull();
    expect(vietnameseToneTypo("may")).toBeNull();
    expect(vietnameseToneTypo("hai")).toBeNull();
    expect(vietnameseToneTypo("")).toBeNull();
  });

  it("đổi đúng 1 ký tự, khác chuỗi gốc, cùng nhóm nguyên âm", () => {
    const result = vietnameseToneTypo("Xin chào", seededRng());
    expect(result).not.toBeNull();
    expect(result).not.toBe("Xin chào");
    expect(result!.length).toBe("Xin chào".length);
    let diffCount = 0;
    for (let i = 0; i < result!.length; i++) {
      if (result![i] !== "Xin chào"[i]) diffCount++;
    }
    expect(diffCount).toBe(1);
    // Ký tự thay đổi phải nằm trong nhóm "a" (a/á/à/ả/ã/ạ) — chuỗi gốc có "à"
    expect(["a", "á", "à", "ả", "ã", "ạ"]).toContain(result![6].toLowerCase());
  });

  it("giữ nguyên hoa/thường", () => {
    const result = vietnameseToneTypo("Á", seededRng(1))!;
    expect(result).not.toBe("Á");
    expect(result).toBe(result.toUpperCase());
  });

  it("nhiều lần chạy đều hợp lệ trên câu tiếng Việt thật", () => {
    const samples = ["Cảm ơn", "Xin lỗi", "Rất vui được gặp bạn", "Tạm biệt"];
    for (const s of samples) {
      for (let seed = 1; seed <= 5; seed++) {
        const result = vietnameseToneTypo(s, seededRng(seed));
        if (result === null) continue; // câu có thể không có dấu thanh nào (hiếm)
        expect(result).not.toBe(s);
        expect(result.length).toBe(s.length);
      }
    }
  });
});
