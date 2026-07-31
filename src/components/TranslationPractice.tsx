"use client";

import { useRef, useState } from "react";
import {
  buildTranslationItems,
  attachMultipleChoiceOptions,
  type TranslationItem,
} from "@/lib/translation-gen";
import { normalizeAnswer } from "@/lib/normalize-answer";
import { labels } from "@/lib/labels";
import { AudioButton } from "@/components/AudioButton";
import type { VocabRow, GrammarRow } from "@/components/LessonTabs";

const T = labels.translate;

type Phase = "idle" | "playing" | "done";
type Mode = "type" | "choice";

export function TranslationPractice({
  vocab,
  grammar,
}: {
  vocab: VocabRow[];
  grammar: GrammarRow[];
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<Mode>("type");
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState<"correct" | "incorrect" | null>(null);
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Kiểm tra rỗng deterministic (không random) → an toàn để dùng ngay khi render
  const hasContent = vocab.length > 0 || grammar.some((g) => g.examples.length > 0);

  function start() {
    // Sinh danh sách lúc bấm Bắt đầu (không sinh lúc render → tránh hydration mismatch)
    let built = buildTranslationItems({ vocab, grammar });
    if (built.length === 0) return;
    if (mode === "choice") {
      built = attachMultipleChoiceOptions(built);
    }
    setItems(built);
    setIdx(0);
    setScore(0);
    setInput("");
    setSelectedOption(null);
    setChecked(null);
    setPhase("playing");
  }

  function check() {
    if (checked !== null) return;
    const item = items[idx];
    const ok = normalizeAnswer(input) === normalizeAnswer(item.answer);
    setChecked(ok ? "correct" : "incorrect");
    if (ok) setScore((s) => s + 1);
  }

  function chooseOption(option: string) {
    if (checked !== null) return;
    const item = items[idx];
    setSelectedOption(option);
    const ok = option === item.answer;
    setChecked(ok ? "correct" : "incorrect");
    if (ok) setScore((s) => s + 1);
  }

  function next() {
    const n = idx + 1;
    if (n >= items.length) {
      setPhase("done");
      return;
    }
    setIdx(n);
    setInput("");
    setSelectedOption(null);
    setChecked(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (checked === null) check();
    else next();
  }

  const current = items[idx];
  const showChoiceUi = mode === "choice" && !!current?.options;

  return (
    <section>
      <h3 className="text-lg font-bold text-slate-900">{labels.lesson.translate}</h3>

      {!hasContent ? (
        <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          {T.empty}
        </p>
      ) : phase === "idle" ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">{T.intro}</p>

          <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode("type")}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                mode === "type"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              ⌨️ {T.modeType}
            </button>
            <button
              type="button"
              onClick={() => setMode("choice")}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                mode === "choice"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              ☑️ {T.modeChoice}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={start}
              className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              ▶ {T.start}
            </button>
          </div>
        </div>
      ) : phase === "done" ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-3xl font-bold text-brand-600">
            {score}/{items.length}
          </p>
          <p className="mt-1 font-semibold text-slate-900">{T.result(score, items.length)}</p>
          <button
            type="button"
            onClick={start}
            className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {T.restart}
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-700">
              {labels.quiz.progress(idx + 1, items.length)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {current.direction === "VI_KR" ? T.directionViKr : T.directionKrVi}
            </span>
          </div>

          <div className="mt-5 text-center">
            {current.direction === "KR_VI" ? (
              <div className="flex items-center justify-center gap-2">
                <p className="font-korean text-2xl font-bold text-slate-900">{current.prompt}</p>
                <AudioButton
                  text={current.prompt}
                  audioUrl={current.source === "vocab" ? vocab[idxOfVocabPrompt(vocab, current)]?.audioUrl : null}
                />
              </div>
            ) : (
              <p className="text-2xl font-bold text-slate-900">{current.prompt}</p>
            )}
          </div>

          {showChoiceUi ? (
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {current.options!.map((opt) => {
                const isAnswer = opt === current.answer;
                const isChosen = opt === selectedOption;
                let cls = "border-slate-200 bg-white text-slate-800 hover:border-brand-300";
                if (checked !== null) {
                  if (isAnswer) cls = "border-emerald-400 bg-emerald-50 text-emerald-800";
                  else if (isChosen) cls = "border-red-400 bg-red-50 text-red-700";
                  else cls = "border-slate-200 bg-white text-slate-400";
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={checked !== null}
                    onClick={() => chooseOption(opt)}
                    className={`font-korean rounded-xl border px-4 py-3 text-sm font-medium transition ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={checked !== null}
                autoFocus
                placeholder={T.placeholder}
                className={`font-korean w-full rounded-lg border px-3 py-2.5 text-slate-900 outline-none transition focus:ring-2 focus:ring-brand-500/30 ${
                  checked === "correct"
                    ? "border-emerald-400 bg-emerald-50"
                    : checked === "incorrect"
                      ? "border-red-400 bg-red-50"
                      : "border-slate-300 focus:border-brand-500"
                }`}
              />

              {checked === null && (
                <div className="mt-4 text-right">
                  <button
                    type="button"
                    onClick={check}
                    className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    {T.check}
                  </button>
                </div>
              )}
            </div>
          )}

          {checked !== null && (
            <p
              className={`mt-4 text-sm font-medium ${
                checked === "correct" ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {checked === "correct" ? T.correct : T.incorrect}
              {checked === "incorrect" && !showChoiceUi && (
                <span className="ml-1 font-korean font-semibold">
                  — {T.correctAnswerLabel}: {current.answer}
                </span>
              )}
            </p>
          )}

          {checked !== null && (
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {idx + 1 >= items.length ? "Xem kết quả" : T.next}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Tìm audioUrl của từ vựng khớp với prompt hiện tại (nguồn "vocab" mức từ). */
function idxOfVocabPrompt(vocab: VocabRow[], item: TranslationItem): number {
  if (item.source !== "vocab") return -1;
  return vocab.findIndex((v) => v.korean === item.prompt);
}
