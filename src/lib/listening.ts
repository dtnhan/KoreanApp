// Sinh câu hỏi luyện nghe từ vựng (pure, test được, không lưu DB).

export type ListeningVocab = {
  id: string;
  korean: string;
  vietnamese: string;
  audioUrl?: string | null;
};

export type ListeningQuestion = {
  id: string;
  korean: string;
  audioUrl: string | null;
  /** Đáp án đúng (nghĩa tiếng Việt) */
  answer: string;
  /** 4 lựa chọn đã xáo trộn, luôn chứa answer */
  options: string[];
};

export const MIN_DISTINCT_MEANINGS = 4;
export const MAX_QUESTIONS = 10;

type Rng = () => number;

/** Fisher–Yates với rng inject được (mặc định Math.random). */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Tạo bộ câu hỏi "nghe → chọn nghĩa":
 * - Cần ≥ 4 nghĩa tiếng Việt distinct, nếu không trả về [].
 * - Mỗi câu: 3 distractor là nghĩa khác (distinct), 4 lựa chọn xáo trộn.
 * - Tối đa 10 câu mỗi lượt, thứ tự câu ngẫu nhiên.
 */
export function buildListeningQuestions(
  vocab: readonly ListeningVocab[],
  rng: Rng = Math.random,
): ListeningQuestion[] {
  const distinctMeanings = [...new Set(vocab.map((v) => v.vietnamese))];
  if (distinctMeanings.length < MIN_DISTINCT_MEANINGS) return [];

  const chosen = shuffle(vocab, rng).slice(0, MAX_QUESTIONS);

  return chosen.map((word) => {
    const distractors = shuffle(
      distinctMeanings.filter((m) => m !== word.vietnamese),
      rng,
    ).slice(0, 3);
    return {
      id: word.id,
      korean: word.korean,
      audioUrl: word.audioUrl ?? null,
      answer: word.vietnamese,
      options: shuffle([word.vietnamese, ...distractors], rng),
    };
  });
}

/** Kiểm tra bài có đủ từ vựng để luyện nghe không (deterministic, SSR-safe). */
export function canBuildListeningQuiz(vocab: readonly ListeningVocab[]): boolean {
  return new Set(vocab.map((v) => v.vietnamese)).size >= MIN_DISTINCT_MEANINGS;
}
