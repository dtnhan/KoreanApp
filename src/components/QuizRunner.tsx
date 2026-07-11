"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitQuiz, type QuizResult } from "@/actions/quiz";
import { labels } from "@/lib/labels";

const Q = labels.quiz;

export type QuizQuestionData = {
  id: string;
  type: "MCQ_KR_VN" | "MCQ_VN_KR" | "FILL_BLANK";
  prompt: string;
  options: string[];
};

export function QuizRunner({
  lessonId,
  lessonPath,
  questions,
}: {
  lessonId: string;
  lessonPath: string;
  questions: QuizQuestionData[];
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, startTransition] = useTransition();

  const total = questions.length;
  const question = questions[index];
  const isLast = index === total - 1;

  function setAnswer(value: string) {
    setAnswers((a) => ({ ...a, [question.id]: value }));
  }

  function submit() {
    startTransition(async () => {
      const res = await submitQuiz(
        lessonId,
        questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? "" })),
      );
      setResult(res);
    });
  }

  function reset() {
    setResult(null);
    setAnswers({});
    setIndex(0);
  }

  // ---------- Màn hình kết quả ----------
  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-4xl font-bold text-brand-600">
            {result.score}/{result.total}
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {Q.result(result.score, result.total)} ({pct}%)
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {Q.retry}
            </button>
            <Link
              href={lessonPath}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-300"
            >
              {labels.common.backToCourse}
            </Link>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {result.detail.map((d, i) => (
            <div
              key={d.questionId}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                d.correct ? "border-emerald-200" : "border-red-200"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {Q.progress(i + 1, result.total)}{" "}
                <span className={d.correct ? "text-emerald-600" : "text-red-600"}>
                  {d.correct ? "✓ Đúng" : "✗ Sai"}
                </span>
              </p>
              <p className="font-korean mt-2 font-semibold text-slate-900">{d.prompt}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="text-slate-500">{Q.yourAnswer}: </span>
                  <span
                    className={`font-korean font-semibold ${
                      d.correct ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {d.given || Q.notAnswered}
                  </span>
                </p>
                {!d.correct && (
                  <p>
                    <span className="text-slate-500">{Q.correctAnswer}: </span>
                    <span className="font-korean font-semibold text-emerald-700">
                      {d.correctAnswer}
                    </span>
                  </p>
                )}
                {d.explanation && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                    {d.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Làm bài ----------
  const given = answers[question.id] ?? "";
  const answeredCount = questions.filter((q) => (answers[q.id] ?? "") !== "").length;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-brand-700">{Q.progress(index + 1, total)}</span>
        <span className="text-slate-500">
          {answeredCount}/{total} đã trả lời
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-korean text-lg font-semibold text-slate-900">{question.prompt}</p>

        {question.type === "FILL_BLANK" ? (
          <input
            type="text"
            value={given}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={Q.fillBlankPlaceholder}
            className="font-korean mt-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
        ) : (
          <div className="mt-4 space-y-2">
            {question.options.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  given === opt
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-brand-300"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={given === opt}
                  onChange={() => setAnswer(opt)}
                  className="accent-brand-600"
                />
                <span className="font-korean text-sm font-medium text-slate-800">{opt}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:invisible"
        >
          {Q.prev}
        </button>

        {isLast ? (
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Đang chấm..." : Q.submit}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {Q.next}
          </button>
        )}
      </div>
    </div>
  );
}
