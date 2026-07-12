"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildListeningQuestions,
  canBuildListeningQuiz,
  type ListeningQuestion,
} from "@/lib/listening";
import { isSpeechSupported, speakKorean, claimPlayback, releasePlayback } from "@/lib/speech";
import { useSpeechSupported } from "@/lib/useSpeechSupported";
import { labels } from "@/lib/labels";
import type { VocabRow } from "@/components/LessonTabs";

const LI = labels.listening;

type Phase = "idle" | "playing" | "done";

export function ListeningQuiz({ vocab }: { vocab: VocabRow[] }) {
  const speechSupported = useSpeechSupported();
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<ListeningQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const stopRef = useRef<(() => void) | null>(null);

  // Dọn khi unmount
  useEffect(() => {
    return () => stopRef.current?.();
  }, []);

  const eligible = canBuildListeningQuiz(vocab); // deterministic → SSR-safe

  function playQuestion(q: ListeningQuestion) {
    stopRef.current?.();
    if (q.audioUrl) {
      const audio = new Audio(q.audioUrl);
      const stop = () => {
        audio.pause();
        releasePlayback(stop);
      };
      audio.onended = () => releasePlayback(stop);
      audio.onerror = () => {
        releasePlayback(stop);
        if (isSpeechSupported()) stopRef.current = speakKorean(q.korean);
      };
      claimPlayback(stop);
      stopRef.current = stop;
      void audio.play().catch(() => audio.onerror?.(new Event("error") as never));
    } else {
      stopRef.current = speakKorean(q.korean);
    }
  }

  function start() {
    // Sinh câu hỏi lúc bấm Bắt đầu (không sinh lúc render → tránh hydration mismatch)
    const qs = buildListeningQuestions(vocab);
    if (qs.length === 0) return;
    setQuestions(qs);
    setQIdx(0);
    setScore(0);
    setSelected(null);
    setPhase("playing");
    playQuestion(qs[0]);
  }

  function choose(option: string) {
    if (selected !== null) return;
    setSelected(option);
    if (option === questions[qIdx].answer) setScore((s) => s + 1);
  }

  function next() {
    const n = qIdx + 1;
    if (n >= questions.length) {
      stopRef.current?.();
      setPhase("done");
      return;
    }
    setQIdx(n);
    setSelected(null);
    playQuestion(questions[n]);
  }

  return (
    <section>
      <h3 className="text-lg font-bold text-slate-900">{LI.quizTitle}</h3>

      {!eligible ? (
        <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          {LI.needMoreVocab}
        </p>
      ) : phase === "idle" ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">{LI.quizIntro}</p>
          {!speechSupported && (
            <p className="mt-2 text-sm text-amber-700">{labels.lesson.audioUnavailable}</p>
          )}
          <button
            type="button"
            disabled={!speechSupported}
            onClick={start}
            className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ▶ {LI.start}
          </button>
        </div>
      ) : phase === "done" ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-3xl font-bold text-brand-600">
            {score}/{questions.length}
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {LI.result(score, questions.length)}
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {labels.quiz.retry}
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-700">
              {LI.question(qIdx + 1, questions.length)}
            </span>
            <button
              type="button"
              onClick={() => playQuestion(questions[qIdx])}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              🔊 {LI.replay}
            </button>
          </div>

          {/* Lộ từ sau khi chọn */}
          <div className="mt-5 text-center">
            {selected !== null ? (
              <p className="font-korean text-3xl font-bold text-slate-900">
                {questions[qIdx].korean}
              </p>
            ) : (
              <p className="text-3xl font-bold tracking-widest text-slate-300">🔊 ???</p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {questions[qIdx].options.map((opt) => {
              const isAnswer = opt === questions[qIdx].answer;
              const isChosen = opt === selected;
              let cls = "border-slate-200 bg-white text-slate-800 hover:border-brand-300";
              if (selected !== null) {
                if (isAnswer) cls = "border-emerald-400 bg-emerald-50 text-emerald-800";
                else if (isChosen) cls = "border-red-400 bg-red-50 text-red-700";
                else cls = "border-slate-200 bg-white text-slate-400";
              }
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={selected !== null}
                  onClick={() => choose(opt)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${cls}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {qIdx + 1 >= questions.length ? "Xem kết quả" : labels.quiz.next}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
