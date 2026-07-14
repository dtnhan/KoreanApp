"use client";

import { useEffect, useRef, useState } from "react";
import { playKorean } from "@/lib/speech";
import { useSpeechSupported } from "@/lib/useSpeechSupported";
import { labels } from "@/lib/labels";
import type { DialogueBlock } from "@/components/LessonTabs";

const L = labels.lesson;
const LI = labels.listening;

const GAP_MS = 600;
const SLOW_RATE = 0.7;

export function DialoguePlayer({ dialogues }: { dialogues: DialogueBlock[] }) {
  const speechSupported = useSpeechSupported();
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [showKr, setShowKr] = useState(true);
  const [showVi, setShowVi] = useState(true);

  const cancelRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Token phiên phát — tăng lên là mọi callback cũ trở nên vô hiệu (chống double-advance). */
  const sessionRef = useRef(0);
  const slowRef = useRef(false);

  useEffect(() => {
    slowRef.current = slow;
  }, [slow]);

  // Dừng sạch khi unmount (chuyển tab cũng unmount component này)
  useEffect(() => {
    const session = sessionRef;
    const timer = timerRef;
    const cancel = cancelRef;
    return () => {
      session.current++;
      if (timer.current) clearTimeout(timer.current);
      cancel.current?.();
    };
  }, []);

  const dialogue = dialogues[dialogueIdx];

  function stopAll() {
    sessionRef.current++;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    cancelRef.current?.();
    cancelRef.current = null;
    setPlaying(false);
    setLineIdx(null);
  }

  function playLine(i: number, session: number) {
    if (session !== sessionRef.current) return;
    const lines = dialogue?.lines ?? [];
    if (i >= lines.length) {
      setPlaying(false);
      setLineIdx(null);
      return;
    }
    setLineIdx(i);
    cancelRef.current = playKorean(lines[i].kr, {
      audioUrl: lines[i].audioUrl,
      rate: slowRef.current ? SLOW_RATE : 1,
      onEnd: () => {
        if (session !== sessionRef.current) return;
        timerRef.current = setTimeout(() => {
          if (session !== sessionRef.current) return;
          playLine(i + 1, session);
        }, GAP_MS);
      },
      onError: () => {
        if (session !== sessionRef.current) return;
        setPlaying(false);
        setLineIdx(null);
      },
    });
  }

  function startFrom(i: number) {
    stopAll();
    const session = ++sessionRef.current;
    setPlaying(true);
    playLine(i, session);
  }

  /** Phát lại đúng một dòng, không auto-chuyển tiếp. */
  function playSingle(i: number) {
    stopAll();
    const session = ++sessionRef.current;
    setLineIdx(i);
    cancelRef.current = playKorean(dialogue.lines[i].kr, {
      audioUrl: dialogue.lines[i].audioUrl,
      rate: slowRef.current ? SLOW_RATE : 1,
      onEnd: () => {
        if (session !== sessionRef.current) return;
        setLineIdx(null);
      },
    });
  }

  if (dialogues.length === 0) {
    return (
      <section>
        <h3 className="text-lg font-bold text-slate-900">{LI.dialogueTitle}</h3>
        <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          {LI.noDialogues}
        </p>
      </section>
    );
  }

  const disabled = !speechSupported;

  return (
    <section>
      <h3 className="text-lg font-bold text-slate-900">{LI.dialogueTitle}</h3>

      {!speechSupported && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {L.audioUnavailable}
        </p>
      )}

      {dialogues.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {dialogues.map((d, i) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                stopAll();
                setDialogueIdx(i);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                i === dialogueIdx
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-700"
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          {playing ? (
            <button
              type="button"
              onClick={stopAll}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              ■ {L.stopAudio}
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => startFrom(0)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ▶ {L.playAll}
            </button>
          )}

          <ToggleChip on={slow} onClick={() => setSlow((v) => !v)} label={`🐢 ${L.slowSpeed}`} />
          <ToggleChip
            on={!showKr}
            onClick={() => setShowKr((v) => !v)}
            label={showKr ? L.hideKorean : L.showKorean}
          />
          <ToggleChip
            on={!showVi}
            onClick={() => setShowVi((v) => !v)}
            label={showVi ? L.hideTranslation : L.showTranslation}
          />
        </div>

        <ul className="mt-5 space-y-2">
          {dialogue.lines.map((line, i) => (
            <li
              key={i}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition ${
                lineIdx === i ? "bg-brand-50 ring-1 ring-brand-200" : ""
              }`}
            >
              <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 font-korean text-xs font-semibold text-slate-600">
                {line.speaker}
              </span>
              <div className="flex-1">
                <p className="font-korean text-slate-900">{showKr ? line.kr : "•••"}</p>
                {showVi && <p className="text-sm text-slate-500">{line.vi}</p>}
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => playSingle(i)}
                aria-label={L.playAudio}
                className="mt-0.5 shrink-0 rounded-full p-1.5 text-brand-500 transition hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ToggleChip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        on
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-slate-200 bg-white text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
