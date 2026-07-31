// Sinh danh sách câu luyện dịch (VI↔KR) từ từ vựng + ngữ pháp của bài học.
// Thuần (pure), không lưu DB — rng inject được để test deterministic.

import { shuffle } from "./listening";
import { particleTypo, hangulSpellingTypo } from "./near-miss";

export type TranslationDirection = "VI_KR" | "KR_VI";

export type TranslationItem = {
  id: string;
  direction: TranslationDirection;
  prompt: string;
  answer: string;
  source: "vocab" | "example" | "grammar";
  /** Chỉ có khi đủ ≥2 nhiễu hợp lệ (attachMultipleChoiceOptions). */
  options?: string[];
};

export type TranslationVocab = {
  korean: string;
  vietnamese: string;
  exampleKr?: string | null;
  exampleVi?: string | null;
};

export type TranslationGrammar = {
  examples: { kr: string; vi: string }[];
};

export type TranslationGenInput = {
  vocab: TranslationVocab[];
  grammar: TranslationGrammar[];
};

type Rng = () => number;

export const MAX_TRANSLATION_ITEMS = 20;

function randomDirection(rng: Rng): TranslationDirection {
  return rng() < 0.5 ? "VI_KR" : "KR_VI";
}

function makeItem(
  direction: TranslationDirection,
  kr: string,
  vi: string,
  id: string,
  source: TranslationItem["source"],
): TranslationItem {
  return direction === "VI_KR"
    ? { id, direction, prompt: vi, answer: kr, source }
    : { id, direction, prompt: kr, answer: vi, source };
}

export function buildTranslationItems(
  input: TranslationGenInput,
  rng: Rng = Math.random,
): TranslationItem[] {
  const items: TranslationItem[] = [];

  input.vocab.forEach((v, i) => {
    items.push(makeItem(randomDirection(rng), v.korean, v.vietnamese, `word-${i}`, "vocab"));

    const exKr = (v.exampleKr ?? "").trim();
    const exVi = (v.exampleVi ?? "").trim();
    if (exKr && exVi) {
      items.push(makeItem(randomDirection(rng), exKr, exVi, `example-${i}`, "example"));
    }
  });

  input.grammar.forEach((g, gi) => {
    g.examples.forEach((ex, ei) => {
      const kr = (ex.kr ?? "").trim();
      const vi = (ex.vi ?? "").trim();
      if (!kr || !vi) return;
      items.push(makeItem(randomDirection(rng), kr, vi, `grammar-${gi}-${ei}`, "grammar"));
    });
  });

  return shuffle(items, rng).slice(0, MAX_TRANSLATION_ITEMS);
}

const MAX_EASY_DISTRACTORS = 2;
const MIN_DISTRACTORS_FOR_OPTIONS = 2;

/**
 * Gắn `options` (trắc nghiệm 3-4 lựa chọn) cho mỗi item khi đủ nhiễu hợp lệ:
 * tối đa 1 nhiễu "khó" (near-miss chính tả/ngữ pháp của chính đáp án) + tối đa
 * 2 nhiễu "dễ" (đáp án khác nghĩa, lấy từ item khác CÙNG chiều). Nếu tổng nhiễu
 * hợp lệ < 2 → item không có `options` (UI rơi về ô gõ, an toàn).
 */
export function attachMultipleChoiceOptions(
  items: TranslationItem[],
  rng: Rng = Math.random,
): TranslationItem[] {
  const answersByDirection: Record<TranslationDirection, string[]> = {
    VI_KR: [...new Set(items.filter((i) => i.direction === "VI_KR").map((i) => i.answer))],
    KR_VI: [...new Set(items.filter((i) => i.direction === "KR_VI").map((i) => i.answer))],
  };

  return items.map((item) => {
    const distractors: string[] = [];

    // Nhiễu "khó" — chỉ áp dụng chiều Việt→Hàn (lỗi trợ từ/chính tả Hangul,
    // đúng kiểu lỗi học viên hay mắc). Chiều Hàn→Việt KHÔNG dùng vietnameseToneTypo:
    // đổi dấu thanh thường ra một từ có nghĩa khác hẳn (vd chào→chảo, tạm→tám),
    // không giống "lỗi chính tả" mà chỉ là một từ nhiễu khác nghĩa thông thường.
    const hard =
      item.direction === "VI_KR"
        ? (particleTypo(item.answer) ?? hangulSpellingTypo(item.answer, rng))
        : null;
    if (hard && hard !== item.answer) {
      distractors.push(hard);
    }

    // Nhiễu "dễ" — đáp án khác nghĩa, cùng chiều. Bù thêm 1 nhiễu dễ khi
    // không có nhiễu khó (KR_VI luôn, hoặc VI_KR khi particle/spelling typo thất bại).
    const maxEasy = hard ? MAX_EASY_DISTRACTORS : MAX_EASY_DISTRACTORS + 1;
    const pool = shuffle(
      answersByDirection[item.direction].filter(
        (a) => a !== item.answer && !distractors.includes(a),
      ),
      rng,
    );
    let easyCount = 0;
    for (const a of pool) {
      if (easyCount >= maxEasy) break;
      distractors.push(a);
      easyCount++;
    }

    if (distractors.length < MIN_DISTRACTORS_FOR_OPTIONS) {
      return item; // không đủ nhiễu hợp lệ → rơi về ô gõ (an toàn)
    }

    return {
      ...item,
      options: shuffle([item.answer, ...distractors], rng),
    };
  });
}
