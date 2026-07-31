import { describe, it, expect } from "vitest";
import {
  buildTranslationItems,
  MAX_TRANSLATION_ITEMS,
  type TranslationVocab,
  type TranslationGrammar,
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
