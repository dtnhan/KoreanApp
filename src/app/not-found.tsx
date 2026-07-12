import Link from "next/link";
import { labels } from "@/lib/labels";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="font-korean text-5xl font-bold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        {labels.common.notFound}
      </h1>
      <p className="mt-2 text-slate-600">
        Trang bạn tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {labels.nav.home}
        </Link>
        <Link
          href="/khoa-hoc"
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300"
        >
          {labels.common.viewCourses}
        </Link>
      </div>
    </div>
  );
}
