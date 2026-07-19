// Sinh hội thoại theo khuôn mẫu an toàn (không AI): lắp danh từ của bài vào
// các khuôn đúng ngữ pháp, chọn trợ từ chuẩn theo batchim. Pure — test được.

import { shuffle } from "./listening";

export type DialogueVocab = { korean: string; vietnamese: string };
export type GeneratedDialogueLine = { speaker: string; kr: string; vi: string };
export type GeneratedDialogue = { title: string; lines: GeneratedDialogueLine[] };

export type DialogueGenInput = {
  vocab: DialogueVocab[];
  reviewVocab?: DialogueVocab[];
  existingTitles: string[];
};

type Rng = () => number;

const SPEAKER_A = "민수";
const SPEAKER_B = "흐엉";

// ---------- Batchim + trợ từ ----------

/** Âm tiết Hangul cuối có phụ âm cuối (batchim) hay không. Ký tự ngoài 가-힣 → false. */
export function hasBatchim(word: string): boolean {
  if (!word) return false;
  const code = word.codePointAt(word.length - 1)!;
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 > 0;
}

export const topicParticle = (n: string) => (hasBatchim(n) ? "은" : "는");
export const subjectParticle = (n: string) => (hasBatchim(n) ? "이" : "가");
export const objectParticle = (n: string) => (hasBatchim(n) ? "을" : "를");
export const copula = (n: string) => (hasBatchim(n) ? "이에요" : "예요");

// ---------- Lọc danh từ ----------

const ALL_HANGUL = /^[가-힣]+$/;

/** Chỉ nhận danh từ thuần Hàn, ≤5 âm tiết, không kết thúc 다 (loại động/tính từ). */
export function isNounCandidate(word: string): boolean {
  return (
    ALL_HANGUL.test(word) && // đã loại dấu cách, "/", ký tự ngoài Hangul
    word.length <= 5 &&
    !word.endsWith("다")
  );
}

/** Viết thường chữ cái đầu để ghép giữa câu tiếng Việt. */
function lowerFirst(s: string): string {
  return s ? s[0].toLocaleLowerCase("vi") + s.slice(1) : s;
}

// ---------- Thư viện khuôn ----------

type NounTemplate = {
  name: string;
  build: (noun: DialogueVocab, rng: Rng) => GeneratedDialogueLine[];
};

const NOUN_TEMPLATES: NounTemplate[] = [
  {
    name: "Hỏi đồ vật",
    build: (n) => [
      { speaker: SPEAKER_A, kr: "이것은 뭐예요?", vi: "Đây là cái gì?" },
      {
        speaker: SPEAKER_B,
        kr: `${n.korean}${copula(n.korean)}.`,
        vi: `Là ${lowerFirst(n.vietnamese)}.`,
      },
      {
        speaker: SPEAKER_A,
        kr: `아, ${n.korean}${copula(n.korean)}? 감사합니다.`,
        vi: `À, ${lowerFirst(n.vietnamese)} à? Cảm ơn.`,
      },
    ],
  },
  {
    name: "Hỏi có không",
    build: (n, rng) => {
      const yes = rng() < 0.5;
      return [
        {
          speaker: SPEAKER_A,
          kr: `${n.korean}${subjectParticle(n.korean)} 있어요?`,
          vi: `Có ${lowerFirst(n.vietnamese)} không?`,
        },
        yes
          ? { speaker: SPEAKER_B, kr: "네, 있어요.", vi: "Vâng, có." }
          : { speaker: SPEAKER_B, kr: "아니요, 없어요.", vi: "Không, không có." },
        yes
          ? { speaker: SPEAKER_A, kr: "감사합니다.", vi: "Cảm ơn." }
          : { speaker: SPEAKER_A, kr: "네, 알겠습니다.", vi: "Vâng, tôi hiểu rồi." },
      ];
    },
  },
  {
    name: "Hỏi thích",
    build: (n) => [
      {
        speaker: SPEAKER_A,
        kr: `${n.korean}${objectParticle(n.korean)} 좋아해요?`,
        vi: `Bạn có thích ${lowerFirst(n.vietnamese)} không?`,
      },
      {
        speaker: SPEAKER_B,
        kr: `네, ${n.korean}${objectParticle(n.korean)} 좋아해요.`,
        vi: `Có, mình thích ${lowerFirst(n.vietnamese)}.`,
      },
    ],
  },
];

const GREETING_TITLE = "Chào hỏi cơ bản";

const GREETING_LINES: GeneratedDialogueLine[] = [
  { speaker: SPEAKER_A, kr: "안녕하세요!", vi: "Xin chào!" },
  {
    speaker: SPEAKER_B,
    kr: "안녕하세요! 만나서 반갑습니다.",
    vi: "Xin chào! Rất vui được gặp bạn.",
  },
  {
    speaker: SPEAKER_A,
    kr: "네, 만나서 반갑습니다.",
    vi: "Vâng, rất vui được gặp bạn.",
  },
];

// ---------- Bộ sinh ----------

/**
 * Chọn khuôn + danh từ chưa dùng (so title với existingTitles), ưu tiên danh từ
 * bài hiện tại rồi mới tới bài trước; khuôn "Chào hỏi cơ bản" là phương án cuối.
 * Trả null khi mọi khuôn khả dụng đã cạn.
 */
export function buildDialogue(
  input: DialogueGenInput,
  rng: Rng = Math.random,
): GeneratedDialogue | null {
  const existing = new Set(input.existingTitles.map((t) => t.trim()));

  const currentNouns = shuffle(
    input.vocab.filter((v) => isNounCandidate(v.korean)),
    rng,
  );
  const reviewNouns = shuffle(
    (input.reviewVocab ?? []).filter((v) => isNounCandidate(v.korean)),
    rng,
  );
  const nouns = [...currentNouns, ...reviewNouns];

  for (const template of shuffle(NOUN_TEMPLATES, rng)) {
    for (const noun of nouns) {
      const title = `${template.name}: ${noun.korean}`;
      if (existing.has(title)) continue;
      return { title, lines: template.build(noun, rng) };
    }
  }

  if (!existing.has(GREETING_TITLE)) {
    return { title: GREETING_TITLE, lines: GREETING_LINES };
  }

  return null;
}
