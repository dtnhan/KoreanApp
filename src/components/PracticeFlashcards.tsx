"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { shuffle } from "@/lib/listening";
import { labels } from "@/lib/labels";
import { AudioButton } from "@/components/AudioButton";
import { SkeletonBlock } from "@/components/Skeleton";

const F = labels.flashcard;

export type PracticeCard = {
  id: string;
  korean: string;
  romanization: string | null;
  vietnamese: string;
  exampleKr: string | null;
  exampleVi: string | null;
  audioUrl: string | null;
};

export function PracticeFlashcards({
  cards,
  lessonPath,
}: {
  cards: PracticeCard[];
  lessonPath: string;
}) {
  // Queue rỗng lúc SSR; shuffle trong effect (tránh hydration mismatch vì Math.random)
  const [queue, setQueue] = useState<PracticeCard[]>([]);
  const [ready, setReady] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [wrongPile, setWrongPile] = useState<PracticeCard[]>([]);
  const [knownCount, setKnownCount] = useState(0);

  useEffect(() => {
    // Chủ đích: xáo trộn sau hydration (Math.random không SSR-safe)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueue(shuffle(cards));
    setReady(true);
  }, [cards]);

  const current = queue[0];

  const mark = useCallback(
    (known: boolean) => {
      if (!current) return;
      if (known) {
        setKnownCount((n) => n + 1);
      } else {
        setWrongPile((p) => [...p, current]);
      }
      setQueue((q) => q.slice(1));
      setFlipped(false);
    },
    [current],
  );

  // Phím tắt: Space/Enter lật; 1 = chưa thuộc, 2 = đã thuộc (khi đã lật)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (flipped) {
        if (e.key === "1") {
          e.preventDefault();
          mark(false);
        } else if (e.key === "2") {
          e.preventDefault();
          mark(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, flipped, mark]);

  function retryWrong() {
    setQueue(shuffle(wrongPile));
    setWrongPile([]);
    setFlipped(false);
  }

  function restart() {
    setQueue(shuffle(cards));
    setWrongPile([]);
    setKnownCount(0);
    setFlipped(false);
  }

  if (!ready) {
    return (
      <div className="mt-6">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="mt-4 h-12" />
      </div>
    );
  }

  // ---------- Hết queue ----------
  if (!current) {
    if (wrongPile.length > 0) {
      return (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Còn {wrongPile.length} thẻ bạn chưa thuộc.
          </p>
          <button
            type="button"
            onClick={retryWrong}
            className="mt-4 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {F.retryWrong(wrongPile.length)}
          </button>
        </div>
      );
    }
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-3xl">🎉</p>
        <h2 className="mt-3 text-xl font-bold text-slate-900">{F.practiceDone}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {F.known}: {knownCount}/{cards.length}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {F.restart}
          </button>
          <Link
            href={lessonPath}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300"
          >
            {labels.common.backToCourse}
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Thẻ hiện tại ----------
  return (
    <div className="mt-6">
      <p className="text-right text-xs font-medium text-slate-500">{F.remaining(queue.length)}</p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((f) => !f)}
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
              <span className="block text-sm italic text-slate-500">{current.romanization}</span>
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
          <span className="mt-6 text-sm text-slate-400">{F.flipHint} (Space)</span>
        )}
      </div>

      {flipped ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => mark(false)}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            ✗ {F.unknown}
            <span className="block text-[10px] font-normal opacity-60">1</span>
          </button>
          <button
            type="button"
            onClick={() => mark(true)}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            ✓ {F.known}
            <span className="block text-[10px] font-normal opacity-60">2</span>
          </button>
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
