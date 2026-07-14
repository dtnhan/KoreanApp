import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCoursesWithProgress } from "@/lib/progress";
import { CourseCard } from "@/components/CourseCard";
import { labels } from "@/lib/labels";

export default async function HomePage() {
  const session = await auth();
  const courses = await getCoursesWithProgress(session?.user?.id);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              한국어 · Tiếng Hàn Tổng Hợp
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Học tiếng Hàn theo giáo trình{" "}
              <span className="text-brand-600">Tiếng Hàn Tổng Hợp</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Lộ trình 6 cấp độ từ Sơ cấp đến Cao cấp với từ vựng, ngữ pháp và hội thoại
              chuẩn. Ôn từ vựng bằng flashcard theo phương pháp lặp lại ngắt quãng (SRS) và
              theo dõi tiến độ học tập của bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/khoa-hoc"
                className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                {labels.common.viewCourses}
              </Link>
              <Link
                href="/khoa-hoc/so-cap-1/bai-1"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                Học thử Bài 1
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { t: "Giáo trình chuẩn", d: "Nội dung bám sát bộ Tiếng Hàn Tổng Hợp, 6 cấp độ." },
              { t: "Flashcard SRS", d: "Ôn từ vựng thông minh, nhắc đúng lúc bạn sắp quên." },
              { t: "Theo dõi tiến độ", d: "Đánh dấu bài đã học và xem phần trăm hoàn thành." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-900">{f.t}</p>
                <p className="mt-1 text-sm text-slate-600">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Giới thiệu Học ghi nhớ ngắt quãng (SRS) */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-sm md:p-12">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              SRS · Thuật toán SM-2
            </span>
            <h2 className="mt-4 text-3xl font-bold">Học ghi nhớ ngắt quãng</h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-50">
              Mỗi thẻ từ vựng sẽ quay lại đúng lúc bạn sắp quên — không sớm quá,
              không muộn quá. Thuật toán SM-2 tự tính lịch ôn dựa trên mức độ bạn
              nhớ, giúp bạn nhớ lâu mà chỉ cần ôn vài phút mỗi ngày các thẻ đến hạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/on-tap"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
              >
                Ôn thẻ hôm nay
              </Link>
              <Link
                href="/khoa-hoc"
                className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Chọn bài để bắt đầu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Danh sách khóa học */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Các khóa học</h2>
            <p className="mt-1 text-slate-600">Chọn cấp độ phù hợp để bắt đầu.</p>
          </div>
          <Link href="/khoa-hoc" className="hidden text-sm font-medium text-brand-600 hover:text-brand-700 sm:block">
            Xem tất cả →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              slug={c.slug}
              title={c.title}
              description={c.description}
              lessonCount={c.lessonCount}
              progress={c.progress}
            />
          ))}
        </div>
      </section>
    </>
  );
}
