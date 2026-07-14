import Link from "next/link";
import { labels } from "@/lib/labels";
import type { StudyActivity } from "@/lib/study-stats";

const H = labels.home;

const CHART_HEIGHT = 88; // px — vùng vẽ cột
const MIN_BAR = 4; // px — mẩu cột tối thiểu cho giá trị 0

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    // Ảnh Google là host ngoài → dùng <img> thường (tránh cấu hình next/image domains)
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt={name ?? "avatar"}
        className="h-11 w-11 rounded-full border border-slate-200 object-cover"
      />
    );
  }
  const letter = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
      {letter}
    </span>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent: "amber" | "brand" | "slate";
}) {
  const color =
    accent === "amber"
      ? "text-amber-500"
      : accent === "brand"
        ? "text-brand-600"
        : "text-slate-800";
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export function StudyActivityCard({
  user,
  stats,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  stats: StudyActivity;
}) {
  const maxCount = Math.max(1, ...stats.forecast.map((f) => f.count));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{H.activityTitle}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {user.name ?? user.email ?? "Bạn"}
          </p>
        </div>
        <Avatar name={user.name ?? user.email} image={user.image} />
      </div>

      {/* Số liệu */}
      <div className="mt-5 flex items-stretch gap-4">
        <Stat
          label={H.streak}
          accent="amber"
          value={
            <span className="flex items-baseline gap-1">
              <span aria-hidden>🔥</span>
              {stats.streak}
              <span className="text-sm font-medium text-slate-400">ngày</span>
            </span>
          }
        />
        <div className="w-px shrink-0 self-stretch bg-slate-200" />
        <Stat label={H.due} accent="brand" value={stats.dueCount} />
        <div className="w-px shrink-0 self-stretch bg-slate-200" />
        <Stat label={H.mastered} accent="slate" value={stats.masteredCount} />
      </div>

      {/* Biểu đồ dự báo 7 ngày */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {H.forecast}
        </p>
        <div className="mt-3 flex items-end justify-between gap-2" style={{ height: CHART_HEIGHT + 22 }}>
          {stats.forecast.map((bar, i) => {
            const barPx =
              bar.count > 0
                ? Math.max(MIN_BAR + 4, Math.round((bar.count / maxCount) * CHART_HEIGHT))
                : MIN_BAR;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span
                  className={`text-xs font-semibold ${
                    bar.count > 0 ? "text-slate-600" : "text-transparent"
                  }`}
                >
                  {bar.count}
                </span>
                <div
                  className={`w-full max-w-8 rounded-t-md transition-all ${
                    bar.isToday
                      ? "bg-amber-400"
                      : bar.count > 0
                        ? "bg-brand-500"
                        : "bg-slate-200"
                  }`}
                  style={{ height: barPx }}
                  title={`${bar.label}: ${bar.count} thẻ`}
                />
                <span
                  className={`text-xs ${
                    bar.isToday ? "font-bold text-amber-600" : "font-medium text-slate-400"
                  }`}
                >
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nút hành động */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/on-tap"
          className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {H.reviewBtn}
        </Link>
        <Link
          href="/the-cua-toi"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          {H.createDeckBtn}
        </Link>
      </div>
    </div>
  );
}
