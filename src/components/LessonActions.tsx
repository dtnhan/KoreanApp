"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleLessonComplete } from "@/actions/progress";
import { addLessonToDeck } from "@/actions/flashcards";
import { labels } from "@/lib/labels";

const L = labels.lesson;

export function LessonActions({
  lessonId,
  lessonPath,
  isAuthed,
  initialCompleted,
}: {
  lessonId: string;
  lessonPath: string;
  isAuthed: boolean;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, startTransition] = useTransition();
  const [deckPending, startDeckTransition] = useTransition();
  const [deckMessage, setDeckMessage] = useState<string | null>(null);

  const secondaryBtn =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAuthed ? (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await toggleLessonComplete(lessonId);
                setCompleted(res.completed);
                if (res.completed) {
                  setDeckMessage(labels.flashcard.autoAdded);
                }
              })
            }
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
              completed
                ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-brand-600 text-white hover:bg-brand-700"
            }`}
          >
            {pending
              ? "Đang lưu..."
              : completed
                ? `${labels.progress.completed} ✓`
                : `✓ ${L.markComplete}`}
          </button>

          <button
            type="button"
            disabled={deckPending}
            onClick={() =>
              startDeckTransition(async () => {
                const res = await addLessonToDeck(lessonId);
                setDeckMessage(
                  res.added > 0
                    ? labels.flashcard.addedCards(res.added)
                    : labels.flashcard.alreadyInDeck,
                );
              })
            }
            className={`${secondaryBtn} disabled:opacity-60`}
          >
            {deckPending ? "Đang thêm..." : `+ ${L.addToDeck}`}
          </button>
        </>
      ) : (
        <Link
          href={`/dang-nhap?callbackUrl=${encodeURIComponent(lessonPath)}`}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {labels.progress.loginPrompt}
        </Link>
      )}

      <Link href={`${lessonPath}/kiem-tra`} className={secondaryBtn}>
        {L.takeQuiz}
      </Link>

      {deckMessage && (
        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
          {deckMessage}{" "}
          <Link href="/on-tap" className="font-semibold underline">
            {labels.nav.review} →
          </Link>
        </span>
      )}
    </div>
  );
}
