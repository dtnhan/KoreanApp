import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { endOfTodayVN } from "@/lib/srs";
import { labels } from "@/lib/labels";
import { FlashcardReviewer } from "@/components/FlashcardReviewer";

export const metadata: Metadata = { title: labels.nav.review };

export default async function ReviewPage() {
  const user = await requireUser("/on-tap");

  const dueCards = await prisma.flashcard.findMany({
    where: { userId: user.id, dueDate: { lte: endOfTodayVN() } },
    orderBy: { dueDate: "asc" },
    take: 100,
    include: { vocabularyItem: true },
  });

  const F = labels.flashcard;

  if (dueCards.length === 0) {
    const totalCards = await prisma.flashcard.count({ where: { userId: user.id } });

    // Chưa có thẻ nào → hướng dẫn bắt đầu
    if (totalCards === 0) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900">{F.noCardsTitle}</h1>
          <p className="mx-auto mt-4 max-w-lg text-slate-600">{F.noCardsIntro}</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">{F.noCardsHowTo}</p>
          <Link
            href="/khoa-hoc"
            className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {F.chooseLesson}
          </Link>
        </div>
      );
    }

    // Có thẻ nhưng không đến hạn hôm nay
    const next = await prisma.flashcard.findFirst({
      where: { userId: user.id, dueDate: { gt: endOfTodayVN() } },
      orderBy: { dueDate: "asc" },
      select: { dueDate: true },
    });
    const nextWhen = next
      ? new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(next.dueDate)
      : null;

    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{labels.nav.review}</h1>
        <p className="mt-4 text-lg text-slate-600">{F.empty}</p>
        <p className="mt-2 text-sm text-slate-500">{F.comeBackTomorrow}</p>
        {nextWhen && (
          <p className="mt-1 text-sm text-slate-400">{F.nextDue(nextWhen)}</p>
        )}
        <Link
          href="/khoa-hoc"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {labels.common.viewCourses}
        </Link>
      </div>
    );
  }

  const cards = dueCards.map((c) => ({
    id: c.id,
    korean: c.vocabularyItem.korean,
    romanization: c.vocabularyItem.romanization,
    vietnamese: c.vocabularyItem.vietnamese,
    exampleKr: c.vocabularyItem.exampleKr,
    exampleVi: c.vocabularyItem.exampleVi,
    audioUrl: c.vocabularyItem.audioUrl,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{F.srsTitle}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {labels.flashcard.dueToday(cards.length)}
      </p>
      <FlashcardReviewer initialCards={cards} />
    </div>
  );
}
