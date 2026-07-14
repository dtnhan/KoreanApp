import { describe, it, expect } from "vitest";
import {
  schedule,
  startOfDayVN,
  endOfTodayVN,
  addDays,
  vnDateString,
  MIN_EF,
  MAX_EF,
  MAX_INTERVAL_DAYS,
  type SrsCardState,
} from "./srs";

const NEW_CARD: SrsCardState = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  lapses: 0,
};

// 2026-07-11 10:00 giờ VN (03:00 UTC)
const NOW = new Date("2026-07-11T03:00:00.000Z");

describe("startOfDayVN / endOfTodayVN", () => {
  it("tính 00:00 giờ VN (UTC+7)", () => {
    expect(startOfDayVN(NOW).toISOString()).toBe("2026-07-10T17:00:00.000Z");
  });

  it("qua nửa đêm VN nhưng chưa qua nửa đêm UTC vẫn là ngày VN mới", () => {
    // 2026-07-11 23:30 UTC = 2026-07-12 06:30 VN
    const lateUtc = new Date("2026-07-11T23:30:00.000Z");
    expect(startOfDayVN(lateUtc).toISOString()).toBe("2026-07-11T17:00:00.000Z");
  });

  it("endOfTodayVN là 23:59:59.999 giờ VN", () => {
    expect(endOfTodayVN(NOW).toISOString()).toBe("2026-07-11T16:59:59.999Z");
  });
});

describe("vnDateString", () => {
  it("trả về ngày lịch VN dạng YYYY-MM-DD", () => {
    expect(vnDateString(NOW)).toBe("2026-07-11");
  });

  it("tối muộn UTC nhưng đã sang ngày mới ở VN", () => {
    // 2026-07-11 23:30 UTC = 2026-07-12 06:30 VN
    expect(vnDateString(new Date("2026-07-11T23:30:00.000Z"))).toBe("2026-07-12");
  });

  it("ngay trước nửa đêm VN vẫn là ngày cũ", () => {
    // 2026-07-11 16:30 UTC = 2026-07-11 23:30 VN
    expect(vnDateString(new Date("2026-07-11T16:30:00.000Z"))).toBe("2026-07-11");
  });
});

describe("schedule — thẻ mới (EF 2.5, interval 0, reps 0)", () => {
  it("AGAIN: reps=0, interval=0, lapses+1, EF-0.20, due=now", () => {
    const r = schedule(NEW_CARD, "AGAIN", NOW);
    expect(r.repetitions).toBe(0);
    expect(r.intervalDays).toBe(0);
    expect(r.lapses).toBe(1);
    expect(r.easeFactor).toBe(2.3);
    expect(r.dueDate.getTime()).toBe(NOW.getTime());
    expect(r.lastReviewedAt.getTime()).toBe(NOW.getTime());
  });

  it("HARD: reps=1, interval=1, EF-0.15", () => {
    const r = schedule(NEW_CARD, "HARD", NOW);
    expect(r.repetitions).toBe(1);
    expect(r.intervalDays).toBe(1);
    expect(r.easeFactor).toBe(2.35);
    expect(r.lapses).toBe(0);
    expect(r.dueDate.toISOString()).toBe(addDays(startOfDayVN(NOW), 1).toISOString());
  });

  it("GOOD: reps=1, interval=1, EF giữ nguyên, due = 00:00 VN + 1 ngày", () => {
    const r = schedule(NEW_CARD, "GOOD", NOW);
    expect(r.repetitions).toBe(1);
    expect(r.intervalDays).toBe(1);
    expect(r.easeFactor).toBe(2.5);
    expect(r.dueDate.toISOString()).toBe("2026-07-11T17:00:00.000Z"); // 00:00 VN 12/07
  });

  it("EASY: reps=1, interval=4, EF+0.15", () => {
    const r = schedule(NEW_CARD, "EASY", NOW);
    expect(r.repetitions).toBe(1);
    expect(r.intervalDays).toBe(4);
    expect(r.easeFactor).toBe(2.65);
    expect(r.dueDate.toISOString()).toBe(addDays(startOfDayVN(NOW), 4).toISOString());
  });
});

describe("schedule — chuỗi GOOD", () => {
  it("interval tiến triển 1 → 6 → round(6×EF)", () => {
    let card: SrsCardState = { ...NEW_CARD };

    const r1 = schedule(card, "GOOD", NOW);
    expect(r1.intervalDays).toBe(1);

    card = r1;
    const r2 = schedule(card, "GOOD", NOW);
    expect(r2.intervalDays).toBe(6);

    card = r2;
    const r3 = schedule(card, "GOOD", NOW);
    expect(r3.intervalDays).toBe(Math.round(6 * 2.5)); // 15
    expect(r3.repetitions).toBe(3);
    expect(r3.easeFactor).toBe(2.5);
  });
});

describe("schedule — HARD với thẻ đã có interval", () => {
  it("interval = max(interval+1, round(interval×1.2))", () => {
    const card: SrsCardState = {
      easeFactor: 2.5,
      intervalDays: 10,
      repetitions: 3,
      lapses: 0,
    };
    const r = schedule(card, "HARD", NOW);
    expect(r.intervalDays).toBe(Math.max(11, Math.round(10 * 1.2))); // 12
    expect(r.repetitions).toBe(4);
  });

  it("interval nhỏ vẫn tăng ít nhất 1 ngày", () => {
    const card: SrsCardState = {
      easeFactor: 2.5,
      intervalDays: 2,
      repetitions: 2,
      lapses: 0,
    };
    // round(2×1.2)=2 nhưng max(3, 2)=3
    expect(schedule(card, "HARD", NOW).intervalDays).toBe(3);
  });
});

describe("schedule — giới hạn EF", () => {
  it("EF không xuống dưới 1.3 khi AGAIN liên tục", () => {
    let card: SrsCardState = { ...NEW_CARD };
    for (let i = 0; i < 10; i++) {
      card = schedule(card, "AGAIN", NOW);
    }
    expect(card.easeFactor).toBe(MIN_EF);
    expect(card.lapses).toBe(10);
  });

  it("EF không xuống dưới 1.3 khi HARD liên tục", () => {
    let card: SrsCardState = { ...NEW_CARD };
    for (let i = 0; i < 12; i++) {
      card = schedule(card, "HARD", NOW);
    }
    expect(card.easeFactor).toBe(MIN_EF);
  });

  it("EF không vượt trần 2.8 khi EASY liên tục", () => {
    let card: SrsCardState = { ...NEW_CARD };
    for (let i = 0; i < 5; i++) {
      card = schedule(card, "EASY", NOW);
    }
    expect(card.easeFactor).toBe(MAX_EF);
  });
});

describe("schedule — cap 365 ngày", () => {
  it("GOOD với interval lớn bị chặn ở 365", () => {
    const card: SrsCardState = {
      easeFactor: 2.5,
      intervalDays: 300,
      repetitions: 5,
      lapses: 0,
    };
    const r = schedule(card, "GOOD", NOW);
    expect(r.intervalDays).toBe(MAX_INTERVAL_DAYS); // round(300×2.5)=750 → 365
    expect(r.dueDate.toISOString()).toBe(
      addDays(startOfDayVN(NOW), 365).toISOString(),
    );
  });

  it("EASY với interval lớn bị chặn ở 365", () => {
    const card: SrsCardState = {
      easeFactor: 2.8,
      intervalDays: 200,
      repetitions: 6,
      lapses: 0,
    };
    expect(schedule(card, "EASY", NOW).intervalDays).toBe(MAX_INTERVAL_DAYS);
  });
});

describe("schedule — lapse không reset EF/lapses khi trả lời đúng lại", () => {
  it("sau AGAIN rồi GOOD: reps đếm lại từ đầu, lapses giữ nguyên", () => {
    const afterAgain = schedule(NEW_CARD, "AGAIN", NOW);
    const r = schedule(afterAgain, "GOOD", NOW);
    expect(r.repetitions).toBe(1);
    expect(r.intervalDays).toBe(1);
    expect(r.lapses).toBe(1);
    expect(r.easeFactor).toBe(2.3); // EF giữ mức đã giảm
  });
});
