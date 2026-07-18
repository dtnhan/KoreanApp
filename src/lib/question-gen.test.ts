import { describe, it, expect } from "vitest";
import {
  buildQuestions,
  parsePatternVariants,
  MAX_PER_TYPE,
  MAX_PER_GRAMMAR,
  type QuestionGenVocab,
} from "./question-gen";

/** rng xác định trước cho test deterministic (cùng mẫu với listening.test.ts). */
function seededRng(seed = 42): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function makeVocab(n: number): QuestionGenVocab[] {
  return Array.from({ length: n }, (_, i) => ({
    korean: `한국어${i}`,
    vietnamese: `nghĩa ${i}`,
    exampleKr: `이것은 한국어${i} 입니다.`,
    exampleVi: `Đây là nghĩa ${i}.`,
  }));
}

const SEED_GRAMMAR = [
  {
    pattern: "N + 은/는 (trợ từ chủ đề)",
    examples: [
      { kr: "저는 베트남 사람이에요.", vi: "Tôi là người Việt Nam." },
      { kr: "이름은 민수예요.", vi: "Tên (thì) là Minsu." },
    ],
  },
];

describe("parsePatternVariants", () => {
  it("bỏ tiền tố N + và chú thích, tách theo /", () => {
    expect(parsePatternVariants("N + 은/는 (trợ từ chủ đề)")).toEqual(["은", "는"]);
  });

  it("sắp biến thể dài nhất trước", () => {
    expect(parsePatternVariants("N + 이에요/예요")).toEqual(["이에요", "예요"]);
  });

  it("pattern không có tiền tố/chú thích vẫn hoạt động", () => {
    expect(parsePatternVariants("이/가")).toEqual(["이", "가"]);
  });

  it("pattern không tách được → mảng 1 phần tử", () => {
    expect(parsePatternVariants("V + 고 싶다")).toEqual(["고 싶다"]);
  });
});

describe("buildQuestions — MCQ", () => {
  it("mỗi MCQ có đúng 4 lựa chọn duy nhất và chứa đáp án", () => {
    const qs = buildQuestions(
      { vocab: makeVocab(8), grammar: [], existingPrompts: [] },
      seededRng(),
    );
    const mcqs = qs.filter((q) => q.type !== "FILL_BLANK");
    expect(mcqs.length).toBeGreaterThan(0);
    for (const q of mcqs) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
    }
  });

  it("sinh cả hai chiều Hàn→Việt và Việt→Hàn", () => {
    const qs = buildQuestions(
      { vocab: makeVocab(6), grammar: [], existingPrompts: [] },
      seededRng(),
    );
    expect(qs.some((q) => q.type === "MCQ_KR_VN")).toBe(true);
    expect(qs.some((q) => q.type === "MCQ_VN_KR")).toBe(true);
  });

  it("<4 nghĩa distinct → không sinh MCQ (vẫn có thể sinh FILL_BLANK)", () => {
    const qs = buildQuestions(
      { vocab: makeVocab(3), grammar: [], existingPrompts: [] },
      seededRng(),
    );
    expect(qs.every((q) => q.type === "FILL_BLANK")).toBe(true);
  });

  it("cap tối đa 5 câu mỗi dạng", () => {
    const qs = buildQuestions(
      { vocab: makeVocab(20), grammar: [], existingPrompts: [] },
      seededRng(),
    );
    const byType = (t: string) => qs.filter((q) => q.type === t).length;
    expect(byType("MCQ_KR_VN")).toBeLessThanOrEqual(MAX_PER_TYPE);
    expect(byType("MCQ_VN_KR")).toBeLessThanOrEqual(MAX_PER_TYPE);
    expect(byType("FILL_BLANK")).toBeLessThanOrEqual(MAX_PER_TYPE);
  });
});

describe("buildQuestions — FILL_BLANK từ vựng", () => {
  it("đục đúng từ trong câu ví dụ, kèm gợi ý nghĩa", () => {
    const vocab: QuestionGenVocab[] = [
      {
        korean: "학교",
        vietnamese: "Trường học",
        exampleKr: "저는 학교에 가요.",
        exampleVi: "Tôi đi đến trường.",
      },
    ];
    const qs = buildQuestions({ vocab, grammar: [], existingPrompts: [] }, seededRng());
    const fb = qs.find((q) => q.type === "FILL_BLANK");
    expect(fb).toBeDefined();
    expect(fb!.prompt).toBe("저는 ___에 가요. (gợi ý: Tôi đi đến trường.)");
    expect(fb!.answer).toBe("학교");
    expect(fb!.options).toEqual([]);
  });

  it("bỏ qua khi exampleKr không chứa từ", () => {
    const vocab: QuestionGenVocab[] = [
      { korean: "학교", vietnamese: "Trường học", exampleKr: "안녕하세요.", exampleVi: "Xin chào." },
    ];
    const qs = buildQuestions({ vocab, grammar: [], existingPrompts: [] }, seededRng());
    expect(qs).toHaveLength(0);
  });
});

describe("buildQuestions — ngữ pháp", () => {
  it("đục đúng biến thể trong ví dụ seed thật", () => {
    const qs = buildQuestions(
      { vocab: [], grammar: SEED_GRAMMAR, existingPrompts: [] },
      seededRng(),
    );
    // "저는 베트남 사람이에요." chứa 는 (không chứa 은) → đục 는
    const q1 = qs.find((q) => q.prompt.startsWith("저(__)"));
    expect(q1).toBeDefined();
    expect(q1!.answer).toBe("는");
    expect(q1!.prompt).toBe("저(__) 베트남 사람이에요. (nghĩa: Tôi là người Việt Nam.)");
    expect(q1!.explanation).toBe("Cấu trúc: N + 은/는 (trợ từ chủ đề)");
    // "이름은 민수예요." chứa 은 → đục 은
    const q2 = qs.find((q) => q.answer === "은");
    expect(q2).toBeDefined();
    expect(q2!.prompt.startsWith("이름(__)")).toBe(true);
  });

  it("khớp biến thể dài nhất trước (이에요 trước 예요)", () => {
    const qs = buildQuestions(
      {
        vocab: [],
        grammar: [
          {
            pattern: "N + 이에요/예요",
            examples: [{ kr: "저는 학생이에요.", vi: "Tôi là học sinh." }],
          },
        ],
        existingPrompts: [],
      },
      seededRng(),
    );
    expect(qs).toHaveLength(1);
    expect(qs[0].answer).toBe("이에요");
    expect(qs[0].prompt).toBe("저는 학생(__). (nghĩa: Tôi là học sinh.)");
  });

  it("tối đa 2 câu mỗi điểm ngữ pháp; bỏ qua ví dụ không khớp", () => {
    const qs = buildQuestions(
      {
        vocab: [],
        grammar: [
          {
            pattern: "N + 은/는 (trợ từ chủ đề)",
            examples: [
              { kr: "저는 학생이에요.", vi: "a" },
              { kr: "이름은 민수예요.", vi: "b" },
              { kr: "친구는 와요.", vi: "c" }, // câu thứ 3 → vượt cap
              { kr: "안녕하세요.", vi: "d" }, // không chứa 은/는... thực ra không chứa
            ],
          },
        ],
        existingPrompts: [],
      },
      seededRng(),
    );
    expect(qs.length).toBe(MAX_PER_GRAMMAR);
  });
});

describe("buildQuestions — dedupe", () => {
  it("không sinh lại câu đã có trong existingPrompts", () => {
    const vocab = makeVocab(6);
    const first = buildQuestions({ vocab, grammar: SEED_GRAMMAR, existingPrompts: [] }, seededRng());
    const second = buildQuestions(
      { vocab, grammar: SEED_GRAMMAR, existingPrompts: first.map((q) => q.prompt) },
      seededRng(),
    );
    const firstPrompts = new Set(first.map((q) => q.prompt.trim()));
    for (const q of second) {
      expect(firstPrompts.has(q.prompt.trim())).toBe(false);
    }
  });

  it("không có prompt trùng lặp nội bộ", () => {
    const qs = buildQuestions(
      { vocab: makeVocab(10), grammar: SEED_GRAMMAR, existingPrompts: [] },
      seededRng(),
    );
    expect(new Set(qs.map((q) => q.prompt.trim())).size).toBe(qs.length);
  });
});
