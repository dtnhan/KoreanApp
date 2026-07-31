// Sinh danh sách câu luyện dịch (VI↔KR) từ từ vựng + ngữ pháp của bài học.
// Thuần (pure), không lưu DB — rng inject được để test deterministic.

import { shuffle } from "./listening";

export type TranslationDirection = "VI_KR" | "KR_VI";

export type TranslationItem = {
  id: string;
  direction: TranslationDirection;
  prompt: string;
  answer: string;
  source: "vocab" | "example" | "grammar";
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
