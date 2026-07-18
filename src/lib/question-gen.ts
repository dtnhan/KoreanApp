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
  existingPrompts: string[];
};

type Rng = () => number;

/** Tối đa mỗi dạng câu hỏi trong một lần sinh. */
export const MAX_PER_TYPE = 5;
/** Tối đa số câu cho mỗi điểm ngữ pháp. */
export const MAX_PER_GRAMMAR = 2;
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

  const distinctMeanings = [...new Set(vocab.map((v) => v.vietnamese))];
  const distinctKorean = [...new Set(vocab.map((v) => v.korean))];
  const canMcq =
    distinctMeanings.length >= MIN_DISTINCT_FOR_MCQ &&
    distinctKorean.length >= MIN_DISTINCT_FOR_MCQ;

  // ---------- MCQ Hàn → Việt ----------
  if (canMcq) {
    let count = 0;
    for (const v of preferFresh(vocab)) {
      if (count >= MAX_PER_TYPE) break;
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
      });
      if (ok) count++;
    }

    // ---------- MCQ Việt → Hàn ----------
    count = 0;
    for (const v of preferFresh(vocab)) {
      if (count >= MAX_PER_TYPE) break;
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
      });
      if (ok) count++;
    }
  }

  // ---------- FILL_BLANK từ câu ví dụ từ vựng ----------
  let fbCount = 0;
  for (const v of preferFresh(vocab)) {
    if (fbCount >= MAX_PER_TYPE) break;
    const ex = (v.exampleKr ?? "").trim();
    if (!ex || !ex.includes(v.korean)) continue;
    const holed = ex.replace(v.korean, "___");
    const hint = v.exampleVi ? ` (gợi ý: ${v.exampleVi})` : "";
    const ok = push({
      type: "FILL_BLANK",
      prompt: `${holed}${hint}`,
      options: [],
      answer: v.korean,
    });
    if (ok) fbCount++;
  }

  // ---------- FILL_BLANK ngữ pháp (điền trợ từ/đuôi) ----------
  for (const g of grammar) {
    const variants = parsePatternVariants(g.pattern);
    if (variants.length === 0) continue;
    let gCount = 0;
    for (const ex of g.examples) {
      if (gCount >= MAX_PER_GRAMMAR) break;
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
        explanation: `Cấu trúc: ${g.pattern}`,
      });
      if (ok) gCount++;
    }
  }

  return out;
}
