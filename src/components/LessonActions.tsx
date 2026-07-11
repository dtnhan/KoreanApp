"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleLessonComplete } from "@/actions/progress";
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

  const disabledBtn =
    "cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAuthed ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await toggleLessonComplete(lessonId);
              setCompleted(res.completed);
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
      ) : (
        <Link
          href={`/dang-nhap?callbackUrl=${encodeURIComponent(lessonPath)}`}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {labels.progress.loginPrompt}
        </Link>
      )}

      <button type="button" disabled title={L.comingSoon} className={disabledBtn}>
        + {L.addToDeck}
      </button>
      <button type="button" disabled title={L.comingSoon} className={disabledBtn}>
        {L.takeQuiz}
      </button>
    </div>
  );
}
