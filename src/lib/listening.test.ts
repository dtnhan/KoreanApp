import { describe, it, expect } from "vitest";
import {
  buildListeningQuestions,
  canBuildListeningQuiz,
  shuffle,
  MAX_QUESTIONS,
  type ListeningVocab,
} from "./listening";

function makeVocab(n: number): ListeningVocab[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `v${i}`,
    korean: `한국어${i}`,
    vietnamese: `nghĩa ${i}`,
  }));
}

/** rng giả xác định trước để test deterministic. */
function seededRng(seed = 42): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("buildListeningQuestions", () => {
  it("trả về [] khi ít hơn 4 nghĩa distinct", () => {
    expect(buildListeningQuestions(makeVocab(3))).toEqual([]);
    // 5 từ nhưng chỉ 2 nghĩa distinct
    const dupes: ListeningVocab[] = [
      { id: "a", korean: "가", vietnamese: "một" },
      { id: "b", korean: "나", vietnamese: "một" },
      { id: "c", korean: "다", vietnamese: "hai" },
      { id: "d", korean: "라", vietnamese: "hai" },
      { id: "e", korean: "마", vietnamese: "một" },
    ];
    expect(buildListeningQuestions(dupes)).toEqual([]);
  });

  it("đáp án đúng luôn nằm trong 4 lựa chọn, không trùng lặp", () => {
    const qs = buildListeningQuestions(makeVocab(8), seededRng());
    expect(qs.length).toBe(8);
    for (const q of qs) {
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.answer);
      expect(new Set(q.options).size).toBe(4);
      // distractor không được trùng nghĩa đúng
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
    }
  });

  it("cap 10 câu khi bài có nhiều từ hơn", () => {
    const qs = buildListeningQuestions(makeVocab(15), seededRng());
    expect(qs.length).toBe(MAX_QUESTIONS);
  });

  it("đúng 4 từ distinct vẫn tạo được câu hỏi", () => {
    const qs = buildListeningQuestions(makeVocab(4), seededRng());
    expect(qs.length).toBe(4);
    for (const q of qs) {
      expect(new Set(q.options).size).toBe(4);
    }
  });

  it("deterministic với rng cố định", () => {
    const a = buildListeningQuestions(makeVocab(6), seededRng(7));
    const b = buildListeningQuestions(makeVocab(6), seededRng(7));
    expect(a).toEqual(b);
  });

  it("giữ audioUrl của từ", () => {
    const vocab = makeVocab(4).map((v, i) => ({
      ...v,
      audioUrl: i === 0 ? "https://example.com/a.mp3" : null,
    }));
    const qs = buildListeningQuestions(vocab, seededRng());
    const withAudio = qs.find((q) => q.id === "v0");
    expect(withAudio?.audioUrl).toBe("https://example.com/a.mp3");
  });
});

describe("canBuildListeningQuiz", () => {
  it("false khi <4 nghĩa distinct, true khi đủ", () => {
    expect(canBuildListeningQuiz(makeVocab(3))).toBe(false);
    expect(canBuildListeningQuiz(makeVocab(4))).toBe(true);
  });
});

describe("shuffle", () => {
  it("giữ nguyên phần tử, không mutate mảng gốc", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    const out = shuffle(original, seededRng());
    expect(original).toEqual(copy);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
