import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-helpers";
import { labels } from "@/lib/labels";

export const metadata: Metadata = { title: labels.nav.admin };

export default async function AdminPage() {
  const user = await requireAdmin("/admin");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Khu vực quản trị</h1>
      <p className="mt-3 text-slate-600">
        {labels.auth.greeting(user.name ?? "Admin")} Trang quản trị nội dung (CRUD khóa
        học, bài học) {labels.lesson.comingSoon.toLowerCase()}.
      </p>
    </div>
  );
}
