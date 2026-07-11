import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { labels } from "@/lib/labels";

export const metadata: Metadata = { title: labels.nav.review };

export default async function ReviewPage() {
  const user = await requireUser("/on-tap");

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{labels.nav.review}</h1>
      <p className="mt-3 text-slate-600">
        {labels.auth.greeting(user.name ?? user.email ?? "bạn")} Tính năng ôn tập
        flashcard theo phương pháp lặp lại ngắt quãng {labels.lesson.comingSoon.toLowerCase()}.
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
