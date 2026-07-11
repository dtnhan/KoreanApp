import type { Metadata } from "next";
import Link from "next/link";
import { labels } from "@/lib/labels";

export const metadata: Metadata = { title: labels.nav.progress };

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{labels.nav.progress}</h1>
      <p className="mt-3 text-slate-600">
        Trang theo dõi tiến độ học tập {labels.lesson.comingSoon.toLowerCase()}. Đăng nhập để lưu lại quá trình học của bạn.
      </p>
      <Link
        href="/khoa-hoc"
        className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        {labels.common.viewCourses}
      </Link>
    </div>
  );
}
