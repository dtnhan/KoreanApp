// Sinh câu hỏi quiz theo luật (rule-based) từ từ vựng + ngữ pháp của bài học.
// Thuần (pure) — rng inject được để unit-test deterministic.

import { shuffle } from "./listening";

export type GeneratedQuestion = {
  type: "MCQ_KR_VN" | "MCQ_VN_KR" | "FILL_BLANK";
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string;
};

export type QuestionGenVocab = {
  korean: string;
  vietnamese: string;
  exampleKr?: string | null;
  exampleVi?: string | null;
};

export type QuestionGenGrammar = {
  pattern: string;
  examples: { kr: string; vi: string }[];
};

export type QuestionGenInput = {
  vocab: QuestionGenVocab[];
  grammar: QuestionGenGrammar[];
  /** Từ vựng các bài trước (ôn tập lũy tiến) — mặc định []. */
  reviewVocab?: QuestionGenVocab[];
  /** Ngữ pháp các bài trước — mặc định []. */
  reviewGrammar?: QuestionGenGrammar[];
  existingPrompts: string[];
};

type Rng = () => number;

/** Tối đa mỗi dạng câu hỏi trong một lần sinh (bài hiện tại). */
export const MAX_PER_TYPE = 5;
/** Tối đa số câu cho mỗi điểm ngữ pháp (bài hiện tại). */
export const MAX_PER_GRAMMAR = 2;
/** Tối đa câu ÔN TẬP mỗi dạng lấy từ bài trước. */
export const MAX_REVIEW_PER_TYPE = 2;
/** Hậu tố explanation cho câu ôn tập. */
export const REVIEW_SUFFIX = "(Ôn tập bài trước)";
/** Cần tối thiểu bấy nhiêu nghĩa/từ distinct để có 3 đáp án nhiễu. */
const MIN_DISTINCT_FOR_MCQ = 4;

/**
 * Parse pattern kiểu "N + 은/는 (trợ từ chủ đề)" → các biến thể ["은","는"]
 * (bỏ tiền tố N/V/A +, bỏ chú thích trong ngoặc; sắp dài nhất trước để khớp đúng).
 */
export function parsePatternVariants(pattern: string): string[] {
  let core = pattern.replace(/\s*\([^)]*\)\s*$/u, "").trim();
  core = core.replace(/^[NVA]\s*\+\s*/iu, "").trim();
  if (!core) return [];
  return core
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

export function buildQuestions(
  input: QuestionGenInput,
  rng: Rng = Math.random,
): GeneratedQuestion[] {
  const { vocab, grammar, existingPrompts } = input;
  const reviewVocab = input.reviewVocab ?? [];
  const reviewGrammar = input.reviewGrammar ?? [];

  const existing = new Set(existingPrompts.map((p) => p.trim()));
  const seenPrompts = new Set<string>(existing);
  const out: GeneratedQuestion[] = [];

  /** Thêm nếu prompt chưa tồn tại (nội bộ + so với câu đã có). */
  function push(q: GeneratedQuestion): boolean {
    const key = q.prompt.trim();
    if (seenPrompts.has(key)) return false;
    seenPrompts.add(key);
    out.push(q);
    return true;
  }

  /** Từ đã được nhắc trong câu hỏi có sẵn → ưu tiên từ "mới" trước. */
  function isReferenced(v: QuestionGenVocab): boolean {
    for (const p of existing) {
      if (p.includes(v.korean) || p.includes(v.vietnamese)) return true;
    }
    return false;
  }

  function preferFresh(list: QuestionGenVocab[]): QuestionGenVocab[] {
    const fresh = shuffle(list.filter((v) => !isReferenced(v)), rng);
    const used = shuffle(list.filter((v) => isReferenced(v)), rng);
    return [...fresh, ...used];
  }

  // Pool nhiễu MCQ = bài hiện tại + các bài trước (điều kiện ≥4 tính trên pool gộp)
  const combined = [...vocab, ...reviewVocab];
  const distinctMeanings = [...new Set(combined.map((v) => v.vietnamese))];
  const distinctKorean = [...new Set(combined.map((v) => v.korean))];
  const canMcq =
    distinctMeanings.length >= MIN_DISTINCT_FOR_MCQ &&
    distinctKorean.length >= MIN_DISTINCT_FOR_MCQ;

  /** MCQ Hàn → Việt cho một danh sách từ, với cap riêng. */
  function genMcqKrVn(list: QuestionGenVocab[], cap: number, isReview: boolean) {
    if (!canMcq) return;
    let count = 0;
    for (const v of preferFresh(list)) {
      if (count >= cap) break;
      const distractors = shuffle(
        distinctMeanings.filter((m) => m !== v.vietnamese),
        rng,
      ).slice(0, 3);
      if (distractors.length < 3) continue;
      const ok = push({
        type: "MCQ_KR_VN",
        prompt: `'${v.korean}' có nghĩa là gì?`,
        options: shuffle([v.vietnamese, ...distractors], rng),
        answer: v.vietnamese,
        ...(isReview ? { explanation: REVIEW_SUFFIX } : {}),
      });
      if (ok) count++;
    }
  }

  /** MCQ Việt → Hàn. */
  function genMcqVnKr(list: QuestionGenVocab[], cap: number, isReview: boolean) {
    if (!canMcq) return;
    let count = 0;
    for (const v of preferFresh(list)) {
      if (count >= cap) break;
      const distractors = shuffle(
        distinctKorean.filter((k) => k !== v.korean),
        rng,
      ).slice(0, 3);
      if (distractors.length < 3) continue;
      const ok = push({
        type: "MCQ_VN_KR",
        prompt: `'${v.vietnamese}' trong tiếng Hàn là gì?`,
        options: shuffle([v.korean, ...distractors], rng),
        answer: v.korean,
        ...(isReview ? { explanation: REVIEW_SUFFIX } : {}),
      });
      if (ok) count++;
    }
  }

  /** FILL_BLANK từ câu ví dụ từ vựng. */
  function genVocabFillBlank(list: QuestionGenVocab[], cap: number, isReview: boolean) {
    let count = 0;
    for (const v of preferFresh(list)) {
      if (count >= cap) break;
      const ex = (v.exampleKr ?? "").trim();
      if (!ex || !ex.includes(v.korean)) continue;
      const holed = ex.replace(v.korean, "___");
      const hint = v.exampleVi ? ` (gợi ý: ${v.exampleVi})` : "";
      const ok = push({
        type: "FILL_BLANK",
        prompt: `${holed}${hint}`,
        options: [],
        answer: v.korean,
        ...(isReview ? { explanation: REVIEW_SUFFIX } : {}),
      });
      if (ok) count++;
    }
  }

  /**
   * FILL_BLANK ngữ pháp. `perGrammarCap` giới hạn theo từng điểm ngữ pháp;
   * `totalCap` (nếu có) giới hạn tổng — dùng cho câu ôn tập.
   */
  function genGrammarFillBlank(
    list: QuestionGenGrammar[],
    perGrammarCap: number,
    totalCap: number | null,
    isReview: boolean,
  ) {
    let total = 0;
    for (const g of list) {
      if (totalCap !== null && total >= totalCap) break;
      const variants = parsePatternVariants(g.pattern);
      if (variants.length === 0) continue;
      let gCount = 0;
      for (const ex of g.examples) {
        if (gCount >= perGrammarCap) break;
        if (totalCap !== null && total >= totalCap) break;
        const kr = (ex.kr ?? "").trim();
        const vi = (ex.vi ?? "").trim();
        if (!kr) continue;
        // Khớp biến thể dài nhất trước; không khớp → bỏ qua (không sinh câu sai)
        const variant = variants.find((vt) => kr.includes(vt));
        if (!variant) continue;
        const holed = kr.replace(variant, "(__)");
        const ok = push({
          type: "FILL_BLANK",
          prompt: vi ? `${holed} (nghĩa: ${vi})` : holed,
          options: [],
          answer: variant,
          explanation: `Cấu trúc: ${g.pattern}${isReview ? ` ${REVIEW_SUFFIX}` : ""}`,
        });
        if (ok) {
          gCount++;
          total++;
        }
      }
    }
  }

  // ---------- Bài hiện tại (trọng tâm, cap như cũ) ----------
  genMcqKrVn(vocab, MAX_PER_TYPE, false);
  genMcqVnKr(vocab, MAX_PER_TYPE, false);
  genVocabFillBlank(vocab, MAX_PER_TYPE, false);
  genGrammarFillBlank(grammar, MAX_PER_GRAMMAR, null, false);

  // ---------- Ôn tập bài trước (tối đa 2/dạng) ----------
  if (reviewVocab.length > 0) {
    genMcqKrVn(reviewVocab, MAX_REVIEW_PER_TYPE, true);
    genMcqVnKr(reviewVocab, MAX_REVIEW_PER_TYPE, true);
    genVocabFillBlank(reviewVocab, MAX_REVIEW_PER_TYPE, true);
  }
  if (reviewGrammar.length > 0) {
    genGrammarFillBlank(reviewGrammar, MAX_PER_GRAMMAR, MAX_REVIEW_PER_TYPE, true);
  }

  return out;
}
