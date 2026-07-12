"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { reviewCard } from "@/actions/flashcards";
import type { Rating } from "@/lib/srs";
import { labels } from "@/lib/labels";
import { AudioButton } from "@/components/AudioButton";

export type ReviewCardData = {
  id: string;
  korean: string;
  romanization: string | null;
  vietnamese: string;
  exampleKr: string | null;
  exampleVi: string | null;
  audioUrl: string | null;
};

const F = labels.flashcard;

const RATINGS: { rating: Rating; label: string; key: string; cls: string }[] = [
  { rating: "AGAIN", label: F.again, key: "1", cls: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  { rating: "HARD", label: F.hard, key: "2", cls: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { rating: "GOOD", label: F.good, key: "3", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { rating: "EASY", label: F.easy, key: "4", cls: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100" },
];

type Counts = Record<Rating, number>;

export function FlashcardReviewer({ initialCards }: { initialCards: ReviewCardData[] }) {
  const [queue, setQueue] = useState<ReviewCardData[]>(initialCards);
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState<Counts>({ AGAIN: 0, HARD: 0, GOOD: 0, EASY: 0 });
  const [pending, startTransition] = useTransition();

  const current = queue[0];
  const reviewedTotal = counts.AGAIN + counts.HARD + counts.GOOD + counts.EASY;

  const rate = useCallback(
    (rating: Rating) => {
      if (!current || pending) return;
      const card = current;
      startTransition(async () => {
        await reviewCard(card.id, rating);
        setCounts((c) => ({ ...c, [rating]: c[rating] + 1 }));
        setQueue((q) => {
          const rest = q.slice(1);
          // "Lại" → thẻ quay lại cuối hàng đợi trong phiên
          return rating === "AGAIN" ? [...rest, card] : rest;
        });
        setFlipped(false);
      });
    },
    [current, pending],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (flipped) {
        const found = RATINGS.find((r) => r.key === e.key);
        if (found) {
          e.preventDefault();
          rate(found.rating);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, flipped, rate]);

  // ---------- Tổng kết phiên ----------
  if (!current) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-3xl">🎉</p>
        <h2 className="mt-3 text-xl font-bold text-slate-900">{F.sessionDone}</h2>
        <p className="mt-1 text-slate-600">{F.reviewedCount(reviewedTotal)}</p>
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-4 gap-2 text-sm">
          {RATINGS.map((r) => (
            <div key={r.rating} className={`rounded-lg border px-2 py-2 ${r.cls}`}>
              <p className="font-bold">{counts[r.rating]}</p>
              <p className="text-xs">{r.label}</p>
            </div>
          ))}
        </div>
        <Link
          href="/khoa-hoc"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {labels.common.viewCourses}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-right text-xs font-medium text-slate-500">
        {F.remaining(queue.length)}
      </p>

      {/* Thẻ (div role=button để chứa được AudioButton bên trong) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((f) => !f)}
        // Space/Enter đã được xử lý bởi listener keydown toàn cục của phiên ôn
        className="mt-2 flex min-h-72 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:border-brand-300"
      >
        <span className="flex items-center gap-3">
          <span className="font-korean text-4xl font-bold text-slate-900 md:text-5xl">
            {current.korean}
          </span>
          <AudioButton text={current.korean} audioUrl={current.audioUrl} size="md" />
        </span>

        {flipped ? (
          <span className="mt-6 block space-y-2">
            {current.romanization && (
              <span className="block text-sm italic text-slate-500">
                {current.romanization}
              </span>
            )}
            <span className="block text-xl font-semibold text-brand-700">
              {current.vietnamese}
            </span>
            {current.exampleKr && (
              <span className="mt-3 block rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span className="flex items-center justify-center gap-1.5">
                  <span className="font-korean text-slate-800">{current.exampleKr}</span>
                  <AudioButton text={current.exampleKr} />
                </span>
                {current.exampleVi && (
                  <span className="block text-slate-500">{current.exampleVi}</span>
                )}
              </span>
            )}
          </span>
        ) : (
          <span className="mt-6 text-sm text-slate-400">
            {F.showAnswer} (Space)
          </span>
        )}
      </div>

      {/* Nút đánh giá */}
      {flipped ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.rating}
              type="button"
              disabled={pending}
              onClick={() => rate(r.rating)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:opacity-50 ${r.cls}`}
            >
              {r.label}
              <span className="block text-[10px] font-normal opacity-60">{r.key}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {F.showAnswer}
        </button>
      )}
    </div>
  );
}
