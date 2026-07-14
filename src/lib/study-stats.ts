import { prisma } from "@/lib/prisma";
import { startOfDayVN, endOfTodayVN, addDays, vnDateString } from "@/lib/srs";

export const MASTERED_INTERVAL_DAYS = 21;

export type ForecastBar = {
  label: string; // thứ tiếng Việt (Th2..CN)
  count: number;
  isToday: boolean;
};

export type StudyActivity = {
  streak: number;
  dueCount: number;
  masteredCount: number;
  forecast: ForecastBar[];
};

const WEEKDAY_VI = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];

/** Thứ trong tuần (tiếng Việt) của ngày VN ứng với mốc UTC `d`. */
function weekdayViOf(d: Date): string {
  // getUTCDay của startOfDayVN(d) = thứ theo lịch VN vì startOfDayVN neo về 00:00 VN
  const vnMidnightUtc = startOfDayVN(d);
  // 00:00 VN = 17:00 UTC hôm trước → cộng offset để lấy đúng weekday VN
  const vnLocal = new Date(vnMidnightUtc.getTime() + 7 * 60 * 60 * 1000);
  return WEEKDAY_VI[vnLocal.getUTCDay()];
}

/** Tổng hợp số liệu hoạt động học tập cho thẻ trang chủ. */
export async function getStudyActivity(userId: string): Promise<StudyActivity> {
  const now = new Date();
  const todayStart = startOfDayVN(now);

  const [dueCount, masteredCount, upcoming, logDays] = await Promise.all([
    prisma.flashcard.count({
      where: { userId, dueDate: { lte: endOfTodayVN(now) } },
    }),
    prisma.flashcard.count({
      where: { userId, intervalDays: { gte: MASTERED_INTERVAL_DAYS } },
    }),
    prisma.flashcard.findMany({
      where: { userId, dueDate: { lt: addDays(todayStart, 7) } },
      select: { dueDate: true },
    }),
    prisma.dailyStudyLog.findMany({
      where: { userId },
      select: { day: true },
      orderBy: { day: "desc" },
    }),
  ]);

  // ---- Dự báo 7 ngày (cột 0 = hôm nay, gồm cả quá hạn) ----
  const dayKeys: string[] = [];
  for (let i = 0; i < 7; i++) {
    dayKeys.push(vnDateString(addDays(todayStart, i)));
  }
  const todayKey = dayKeys[0];
  const buckets = new Array(7).fill(0);
  for (const { dueDate } of upcoming) {
    const key = vnDateString(dueDate);
    if (key <= todayKey) {
      buckets[0]++; // quá hạn + hôm nay
    } else {
      const idx = dayKeys.indexOf(key);
      if (idx > 0) buckets[idx]++;
    }
  }

  const forecast: ForecastBar[] = dayKeys.map((key, i) => ({
    label: weekdayViOf(addDays(todayStart, i)),
    count: buckets[i],
    isToday: i === 0,
  }));

  // ---- Streak: đếm ngày liên tiếp kết thúc ở hôm nay (hoặc hôm qua nếu hôm nay chưa học) ----
  const daySet = new Set(logDays.map((l) => l.day));
  const yesterdayKey = vnDateString(addDays(todayStart, -1));

  let streak = 0;
  if (daySet.has(todayKey) || daySet.has(yesterdayKey)) {
    // Bắt đầu đếm từ hôm nay nếu có, ngược lại từ hôm qua (ân hạn trong ngày)
    let cursor = daySet.has(todayKey) ? 0 : -1;
    while (daySet.has(vnDateString(addDays(todayStart, cursor)))) {
      streak++;
      cursor--;
    }
  }

  return { streak, dueCount, masteredCount, forecast };
}
