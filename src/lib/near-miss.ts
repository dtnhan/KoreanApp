// Sinh "nhiễu khó" (near-miss) — biến đáp án đúng thành một lỗi sai chính tả/ngữ pháp
// hợp lý, chắc chắn sai. Thuần (pure), rng inject được. Đây là phần rủi ro nhất của
// bộ sinh trắc nghiệm — mọi biến đổi PHẢI luôn tạo ra chuỗi khác đáp án gốc.

import { PARTICLE_PAIRS } from "./dialogue-gen";

type Rng = () => number;

// ---------- 1. Lỗi trợ từ (đổi sang biến thể SAI batchim của chính cặp đó) ----------

type ParticleMatch = { index: number; length: number; replacement: string };

/**
 * Tìm occurrence đầu tiên (ưu tiên khớp dài nhất khi trùng vị trí, để "이에요"
 * không bị nhầm với "이" đứng riêng) của một trong các cặp trợ từ, đổi sang
 * dạng CÒN LẠI của cặp đó — luôn là lỗi sai batchim thật.
 */
export function particleTypo(text: string): string | null {
  let best: ParticleMatch | null = null;

  for (const [a, b] of PARTICLE_PAIRS) {
    for (const [original, replacement] of [
      [a, b],
      [b, a],
    ] as const) {
      const idx = text.indexOf(original);
      if (idx === -1) continue;
      if (
        best === null ||
        idx < best.index ||
        (idx === best.index && original.length > best.length)
      ) {
        best = { index: idx, length: original.length, replacement };
      }
    }
  }

  if (!best) return null;
  return text.slice(0, best.index) + best.replacement + text.slice(best.index + best.length);
}

// ---------- 2. Lỗi chính tả Hangul (đổi 1 âm tiết thành âm tiết hợp lệ khác) ----------

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;

/** Phụ âm cuối "an toàn" để đổi tới (không đảm bảo phát âm hợp lý, chỉ đảm bảo hợp lệ Unicode). */
const SAFE_FINALS = [0, 1, 4, 8, 16, 17, 21] as const; // none, ㄱ, ㄴ, ㄹ, ㅁ, ㅂ, ㅇ

/** Cặp nguyên âm dễ nhầm (chỉ số medial theo bảng Unicode Hangul). */
const MEDIAL_SWAP: Record<number, number> = {
  0: 4, // ㅏ ↔ ㅓ
  4: 0,
  8: 13, // ㅗ ↔ ㅜ
  13: 8,
  1: 5, // ㅐ ↔ ㅔ
  5: 1,
  2: 6, // ㅑ ↔ ㅕ
  6: 2,
};

function isHangulSyllable(code: number): boolean {
  return code >= HANGUL_BASE && code <= HANGUL_LAST;
}

/**
 * Random chọn 1 âm tiết Hangul trong text, đổi phụ âm cuối hoặc nguyên âm giữa
 * sang biến thể khác (luôn ghép lại thành âm tiết Hangul hợp lệ, cùng độ dài chuỗi).
 * Trả null nếu text không có âm tiết Hangul nào.
 */
export function hangulSpellingTypo(text: string, rng: Rng = Math.random): string | null {
  const positions: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (isHangulSyllable(text.charCodeAt(i))) positions.push(i);
  }
  if (positions.length === 0) return null;

  const pos = positions[Math.floor(rng() * positions.length)];
  const offset = text.charCodeAt(pos) - HANGUL_BASE;
  const initial = Math.floor(offset / 588);
  const medial = Math.floor((offset % 588) / 28);
  const final = offset % 28;

  const canSwapMedial = medial in MEDIAL_SWAP;
  const useMedial = canSwapMedial && rng() < 0.5;

  let newMedial = medial;
  let newFinal = final;

  if (useMedial) {
    newMedial = MEDIAL_SWAP[medial];
  } else {
    const choices = SAFE_FINALS.filter((f) => f !== final);
    newFinal = choices[Math.floor(rng() * choices.length)];
  }

  const newCode = HANGUL_BASE + initial * 588 + newMedial * 28 + newFinal;
  return text.slice(0, pos) + String.fromCharCode(newCode) + text.slice(pos + 1);
}

// ---------- 3. Lỗi dấu thanh tiếng Việt ----------

/** Mỗi nhóm: [không dấu, sắc, huyền, hỏi, ngã, nặng] (chữ thường). */
const TONE_GROUPS: readonly string[][] = [
  ["a", "á", "à", "ả", "ã", "ạ"],
  ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"],
  ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"],
  ["e", "é", "è", "ẻ", "ẽ", "ẹ"],
  ["ê", "ế", "ề", "ể", "ễ", "ệ"],
  ["i", "í", "ì", "ỉ", "ĩ", "ị"],
  ["o", "ó", "ò", "ỏ", "õ", "ọ"],
  ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"],
  ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"],
  ["u", "ú", "ù", "ủ", "ũ", "ụ"],
  ["ư", "ứ", "ừ", "ử", "ữ", "ự"],
  ["y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"],
];

function findTone(ch: string): { group: number; tone: number } | null {
  const lower = ch.toLowerCase();
  for (let g = 0; g < TONE_GROUPS.length; g++) {
    const tone = TONE_GROUPS[g].indexOf(lower);
    if (tone !== -1) return { group: g, tone };
  }
  return null;
}

/** Chữ có phân biệt hoa/thường không (để giữ nguyên case khi thay). */
function isUpperLetter(ch: string): boolean {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

/**
 * Random chọn 1 nguyên âm ĐANG CÓ dấu thanh trong text, đổi sang dấu KHÁC
 * trong cùng nhóm nguyên âm (giữ hoa/thường). Trả null nếu text không có
 * nguyên âm nào mang dấu thanh (kể cả rỗng / toàn không dấu).
 */
export function vietnameseToneTypo(text: string, rng: Rng = Math.random): string | null {
  const candidates: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const info = findTone(text[i]);
    if (info && info.tone !== 0) candidates.push(i);
  }
  if (candidates.length === 0) return null;

  const pos = candidates[Math.floor(rng() * candidates.length)];
  const ch = text[pos];
  const info = findTone(ch)!;
  const group = TONE_GROUPS[info.group];
  const otherTones = group.map((_, i) => i).filter((i) => i !== info.tone);
  const newTone = otherTones[Math.floor(rng() * otherTones.length)];
  const replacement = isUpperLetter(ch) ? group[newTone].toUpperCase() : group[newTone];

  return text.slice(0, pos) + replacement + text.slice(pos + 1);
}
