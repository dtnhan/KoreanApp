import Link from "next/link";
import { labels } from "@/lib/labels";

type Props = {
  slug: string;
  title: string;
  description: string;
  lessonCount: number;
  /** Tiến độ của người dùng đã đăng nhập (ẩn với khách) */
  progress?: { completed: number; percent: number };
};

export function CourseCard({ slug, title, description, lessonCount, progress }: Props) {
  return (
    <Link
      href={`/khoa-hoc/${slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
      {progress && lessonCount > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              {progress.completed}/{lessonCount} bài
            </span>
            <span className="text-brand-600">{progress.percent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          {labels.common.lessonCount(lessonCount)}
        </span>
        <span className="text-sm font-medium text-brand-600 group-hover:translate-x-0.5">
          {labels.common.startLearning} →
        </span>
      </div>
    </Link>
  );
}
