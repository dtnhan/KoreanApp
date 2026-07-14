import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { labels } from "@/lib/labels";
import { MyCards, type CustomCard } from "@/components/MyCards";

export const metadata: Metadata = { title: labels.myCards.title };

export default async function MyCardsPage() {
  const user = await requireUser("/the-cua-toi");

  const rows = await prisma.flashcard.findMany({
    where: { userId: user.id, vocabularyItemId: null },
    orderBy: { createdAt: "desc" },
  });

  const cards: CustomCard[] = rows.map((c) => ({
    id: c.id,
    korean: c.customKorean ?? "",
    romanization: c.customRomanization,
    vietnamese: c.customVietnamese ?? "",
    exampleKr: c.customExampleKr,
    exampleVi: c.customExampleVi,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{labels.myCards.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{labels.myCards.subtitle}</p>
      <MyCards cards={cards} />
    </div>
  );
}
