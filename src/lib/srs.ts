// Thuật toán SRS (biến thể SM-2) — hàm thuần, unit-test được.

export type Rating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export type SrsCardState = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
};

export type SrsScheduleResult = SrsCardState & {
  dueDate: Date;
  lastReviewedAt: Date;
};

export const MIN_EF = 1.3;
export const MAX_EF = 2.8;
export const MAX_INTERVAL_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Asia/Ho_Chi_Minh = UTC+7, không có DST. */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** 00:00:00.000 của ngày hiện tại theo giờ Việt Nam (trả về Date UTC tương ứng). */
export function startOfDayVN(d: Date = new Date()): Date {
  const shifted = new Date(d.getTime() + VN_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - VN_OFFSET_MS);
}

/** 23:59:59.999 của ngày hiện tại theo giờ Việt Nam. */
export function endOfTodayVN(d: Date = new Date()): Date {
  return new Date(startOfDayVN(d).getTime() + DAY_MS - 1);
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

/** Ngày lịch theo giờ Việt Nam ở dạng "YYYY-MM-DD" (en-CA cho định dạng ISO). */
export function vnDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(d);
}

/**
 * Tính trạng thái tiếp theo của thẻ sau khi người dùng đánh giá.
 *
 * - AGAIN (Lại): reps=0, interval=0, lapses+1, EF−0.20 (sàn 1.3), due=now (quay lại trong phiên)
 * - HARD  (Khó): reps+1, EF−0.15 (sàn 1.3), interval = reps==1 ? 1 : max(interval+1, round(interval×1.2))
 * - GOOD  (Tốt): reps+1, EF giữ nguyên, interval = reps==1 ? 1 : reps==2 ? 6 : round(interval×EF)
 * - EASY  (Dễ):  reps+1, EF+0.15 (trần 2.8), interval = reps==1 ? 4 : round(interval×EF_mới×1.3)
 *
 * Interval bị chặn ở 365 ngày. dueDate = 00:00 (giờ VN) + intervalDays.
 */
export function schedule(
  card: SrsCardState,
  rating: Rating,
  now: Date = new Date(),
): SrsScheduleResult {
  let { easeFactor, intervalDays, repetitions } = card;
  const { lapses } = card;

  if (rating === "AGAIN") {
    return {
      easeFactor: Math.max(MIN_EF, round2(easeFactor - 0.2)),
      intervalDays: 0,
      repetitions: 0,
      lapses: lapses + 1,
      dueDate: now,
      lastReviewedAt: now,
    };
  }

  repetitions += 1;

  if (rating === "HARD") {
    easeFactor = Math.max(MIN_EF, round2(easeFactor - 0.15));
    intervalDays =
      repetitions === 1
        ? 1
        : Math.max(intervalDays + 1, Math.round(intervalDays * 1.2));
  } else if (rating === "GOOD") {
    intervalDays =
      repetitions === 1
        ? 1
        : repetitions === 2
          ? 6
          : Math.round(intervalDays * easeFactor);
  } else {
    // EASY — dùng EF sau khi tăng
    easeFactor = Math.min(MAX_EF, round2(easeFactor + 0.15));
    intervalDays =
      repetitions === 1 ? 4 : Math.round(intervalDays * easeFactor * 1.3);
  }

  intervalDays = Math.min(MAX_INTERVAL_DAYS, intervalDays);

  return {
    easeFactor,
    intervalDays,
    repetitions,
    lapses,
    dueDate: addDays(startOfDayVN(now), intervalDays),
    lastReviewedAt: now,
  };
}

/** Tránh trôi số thực khi cộng/trừ EF nhiều lần. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
