import { describe, it, expect } from "vitest";
import {
  buildTranslationItems,
  attachMultipleChoiceOptions,
  MAX_TRANSLATION_ITEMS,
  type TranslationVocab,
  type TranslationGrammar,
  type TranslationItem,
} from "./translation-gen";

function seededRng(seed = 42): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function makeVocab(n: number, withExamples: boolean): TranslationVocab[] {
  return Array.from({ length: n }, (_, i) => ({
    korean: `한국어${i}`,
    vietnamese: `nghĩa ${i}`,
    exampleKr: withExamples ? `이것은 한국어${i} 입니다.` : null,
    exampleVi: withExamples ? `Đây là nghĩa ${i}.` : null,
  }));
}

describe("buildTranslationItems", () => {
  it("mảng rỗng → kết quả rỗng", () => {
    expect(buildTranslationItems({ vocab: [], grammar: [] }, seededRng())).toEqual([]);
  });

  it("mỗi từ vựng sinh 1 item cấp từ; có example đầy đủ → thêm 1 item cấp câu", () => {
    const vocab = makeVocab(3, true);
    const items = buildTranslationItems({ vocab, grammar: [] }, seededRng());
    expect(items.length).toBe(6); // 3 word + 3 example
    expect(items.filter((i) => i.source === "vocab").length).toBe(3);
    expect(items.filter((i) => i.source === "example").length).toBe(3);
  });

  it("không sinh item cấp câu khi thiếu exampleKr hoặc exampleVi", () => {
    const vocab: TranslationVocab[] = [
      { korean: "가", vietnamese: "a", exampleKr: "예문입니다.", exampleVi: null },
      { korean: "나", vietnamese: "b", exampleKr: null, exampleVi: "Ví dụ." },
      { korean: "다", vietnamese: "c" },
    ];
    const items = buildTranslationItems({ vocab, grammar: [] }, seededRng());
    expect(items.length).toBe(3); // chỉ 3 word-level, không có example nào đủ cặp
    expect(items.every((i) => i.source === "vocab")).toBe(true);
  });

  it("mỗi cặp ví dụ ngữ pháp sinh 1 item nguồn grammar", () => {
    const grammar: TranslationGrammar[] = [
      { examples: [{ kr: "저는 학생이에요.", vi: "Tôi là học sinh." }, { kr: "이름은 민수예요.", vi: "Tên là Minsu." }] },
    ];
    const items = buildTranslationItems({ vocab: [], grammar }, seededRng());
    expect(items.length).toBe(2);
    expect(items.every((i) => i.source === "grammar")).toBe(true);
  });

  it("cả hai chiều VI_KR và KR_VI đều xuất hiện với input đủ lớn", () => {
    const items = buildTranslationItems(
      { vocab: makeVocab(20, false), grammar: [] },
      seededRng(1),
    );
    expect(items.some((i) => i.direction === "VI_KR")).toBe(true);
    expect(items.some((i) => i.direction === "KR_VI")).toBe(true);
  });

  it("prompt/answer khớp đúng chiều", () => {
    const vocab: TranslationVocab[] = [{ korean: "학교", vietnamese: "Trường học" }];
    const items = buildTranslationItems({ vocab, grammar: [] }, seededRng());
    const item = items[0];
    if (item.direction === "VI_KR") {
      expect(item.prompt).toBe("Trường học");
      expect(item.answer).toBe("학교");
    } else {
      expect(item.prompt).toBe("학교");
      expect(item.answer).toBe("Trường học");
    }
  });

  it("cap tối đa 20 item khi có nhiều hơn", () => {
    const vocab = makeVocab(15, true); // 15 word + 15 example = 30 tiềm năng
    const items = buildTranslationItems({ vocab, grammar: [] }, seededRng());
    expect(items.length).toBe(MAX_TRANSLATION_ITEMS);
  });

  it("deterministic với cùng rng", () => {
    const vocab = makeVocab(10, true);
    const a = buildTranslationItems({ vocab, grammar: [] }, seededRng(7));
    const b = buildTranslationItems({ vocab, grammar: [] }, seededRng(7));
    expect(a).toEqual(b);
  });

  it("id ổn định theo dạng word-i / example-i / grammar-gi-ei", () => {
    const vocab: TranslationVocab[] = [
      { korean: "가", vietnamese: "a", exampleKr: "예문.", exampleVi: "Ví dụ." },
    ];
    const grammar: TranslationGrammar[] = [{ examples: [{ kr: "나가요.", vi: "Đi ra." }] }];
    const items = buildTranslationItems({ vocab, grammar }, seededRng());
    const ids = items.map((i) => i.id).sort();
    expect(ids).toEqual(["example-0", "grammar-0-0", "word-0"]);
  });
});

describe("attachMultipleChoiceOptions", () => {
  function bigVocab(n: number): TranslationVocab[] {
    return Array.from({ length: n }, (_, i) => ({
      korean: `한국어${i}`,
      vietnamese: `nghĩa số ${i}`,
    }));
  }

  it("item đủ nhiễu có options chứa answer, không trùng lặp", () => {
    const items = buildTranslationItems({ vocab: bigVocab(10), grammar: [] }, seededRng());
    const withOptions = attachMultipleChoiceOptions(items, seededRng());
    const withOpts = withOptions.filter((i) => i.options);
    expect(withOpts.length).toBeGreaterThan(0);
    for (const item of withOpts) {
      expect(item.options!.length).toBeGreaterThanOrEqual(3);
      expect(item.options!.length).toBeLessThanOrEqual(4);
      expect(new Set(item.options)).toEqual(new Set(item.options)); // sanity
      expect(new Set(item.options!).size).toBe(item.options!.length); // không trùng
      expect(item.options).toContain(item.answer);
    }
  });

  it("pool quá nhỏ (chỉ 1 item) → không có options (rơi về gõ)", () => {
    const items: TranslationItem[] = [
      { id: "word-0", direction: "VI_KR", prompt: "nghĩa", answer: "단어", source: "vocab" },
    ];
    const result = attachMultipleChoiceOptions(items, seededRng());
    expect(result[0].options).toBeUndefined();
  });

  it("không trộn ngôn ngữ: VI_KR → mọi option là tiếng Hàn, KR_VI → tiếng Việt", () => {
    const items = buildTranslationItems({ vocab: bigVocab(12), grammar: [] }, seededRng(3));
    const withOptions = attachMultipleChoiceOptions(items, seededRng(3));
    for (const item of withOptions) {
      if (!item.options) continue;
      if (item.direction === "VI_KR") {
        // đáp án + nhiễu đều phải là các giá trị "korean" đã sinh (bắt đầu bằng "한국어"
        // hoặc là near-miss biến thể Hangul của chúng) — kiểm tra không lẫn "nghĩa số"
        for (const opt of item.options) {
          expect(opt.includes("nghĩa số")).toBe(false);
        }
      } else {
        for (const opt of item.options) {
          expect(opt.startsWith("한국어")).toBe(false);
        }
      }
    }
  });

  it("khi near-miss không khả dụng, vẫn có thể ra 3 lựa chọn nhờ 2 nhiễu khác nghĩa", () => {
    // Chọn answer không có trợ từ/âm tiết Hangul phù hợp để particleTypo/hangulSpellingTypo
    // vẫn hoạt động thực ra luôn thành công với Hangul — dùng trường hợp KR_VI với câu
    // tiếng Việt không dấu để buộc vietnameseToneTypo trả null.
    const items: TranslationItem[] = [
      { id: "a", direction: "KR_VI", prompt: "가", answer: "toi", source: "vocab" },
      { id: "b", direction: "KR_VI", prompt: "나", answer: "ban", source: "vocab" },
      { id: "c", direction: "KR_VI", prompt: "다", answer: "may", source: "vocab" },
    ];
    const result = attachMultipleChoiceOptions(items, seededRng());
    const first = result.find((i) => i.id === "a")!;
    expect(first.options).toBeDefined();
    expect(first.options!.length).toBe(3); // answer + 2 easy, không có hard
    expect(first.options).toContain("toi");
  });

  it("không thay đổi item không đủ nhiễu (giữ nguyên, không có options)", () => {
    const items: TranslationItem[] = [
      { id: "x", direction: "VI_KR", prompt: "p", answer: "a", source: "vocab" },
      { id: "y", direction: "KR_VI", prompt: "q", answer: "b", source: "vocab" },
    ];
    const result = attachMultipleChoiceOptions(items, seededRng());
    expect(result[0].options).toBeUndefined();
    expect(result[1].options).toBeUndefined();
  });
});
