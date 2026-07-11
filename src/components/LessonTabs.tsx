"use client";

import { useState } from "react";
import { labels } from "@/lib/labels";

export type GrammarExample = { kr: string; vi: string };
export type DialogueLine = { speaker: string; kr: string; vi: string };

export type VocabRow = {
  id: string;
  korean: string;
  romanization: string | null;
  vietnamese: string;
  exampleKr: string | null;
  exampleVi: string | null;
};
export type GrammarRow = {
  id: string;
  pattern: string;
  explanation: string;
  examples: GrammarExample[];
};
export type DialogueBlock = {
  id: string;
  title: string;
  lines: DialogueLine[];
};

type Tab = "vocab" | "grammar" | "dialogue";

const L = labels.lesson;

export function LessonTabs({
  vocab,
  grammar,
  dialogues,
}: {
  vocab: VocabRow[];
  grammar: GrammarRow[];
  dialogues: DialogueBlock[];
}) {
  const [tab, setTab] = useState<Tab>("vocab");
  const [showRoman, setShowRoman] = useState(true);
  const [showTrans, setShowTrans] = useState(true);

  const tabs: { key: Tab; label: string }[] = [
    { key: "vocab", label: L.vocabulary },
    { key: "grammar", label: L.grammar },
    { key: "dialogue", label: L.dialogue },
  ];

  return (
    <div className="mt-6">
      {/* Action buttons (placeholders — tính năng ra mắt sau) */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          title={L.comingSoon}
          className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400"
        >
          ✓ {L.markComplete}
        </button>
        <button
          type="button"
          disabled
          title={L.comingSoon}
          className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400"
        >
          + {L.addToDeck}
        </button>
        <button
          type="button"
          disabled
          title={L.comingSoon}
          className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400"
        >
          {L.takeQuiz}
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "vocab" && <VocabTab vocab={vocab} showRoman={showRoman} setShowRoman={setShowRoman} />}
        {tab === "grammar" && <GrammarTab grammar={grammar} />}
        {tab === "dialogue" && (
          <DialogueTab dialogues={dialogues} showTrans={showTrans} setShowTrans={setShowTrans} />
        )}
      </div>
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
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

function VocabTab({
  vocab,
  showRoman,
  setShowRoman,
}: {
  vocab: VocabRow[];
  showRoman: boolean;
  setShowRoman: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Toggle
          on={showRoman}
          onClick={() => setShowRoman(!showRoman)}
          label={showRoman ? L.hideRomanization : L.showRomanization}
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">{L.stt}</th>
              <th className="px-4 py-3 font-semibold">{L.korean}</th>
              {showRoman && <th className="px-4 py-3 font-semibold">{L.romanization}</th>}
              <th className="px-4 py-3 font-semibold">{L.meaning}</th>
              <th className="px-4 py-3 font-semibold">{L.example}</th>
            </tr>
          </thead>
          <tbody>
            {vocab.map((v, i) => (
              <tr key={v.id} className="border-b border-slate-100 last:border-0 align-top">
                <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-korean text-lg font-semibold text-slate-900">{v.korean}</span>
                </td>
                {showRoman && (
                  <td className="px-4 py-3 italic text-slate-500">{v.romanization ?? "—"}</td>
                )}
                <td className="px-4 py-3 text-slate-800">{v.vietnamese}</td>
                <td className="px-4 py-3">
                  {v.exampleKr ? (
                    <div className="space-y-0.5">
                      <p className="font-korean text-slate-800">{v.exampleKr}</p>
                      {v.exampleVi && <p className="text-xs text-slate-500">{v.exampleVi}</p>}
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GrammarTab({ grammar }: { grammar: GrammarRow[] }) {
  return (
    <div className="space-y-4">
      {grammar.map((g) => (
        <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-korean text-lg font-bold text-brand-700">{g.pattern}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{g.explanation}</p>
          <ul className="mt-4 space-y-2">
            {g.examples.map((ex, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-4 py-2.5">
                <p className="font-korean text-slate-900">{ex.kr}</p>
                <p className="text-sm text-slate-500">{ex.vi}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function DialogueTab({
  dialogues,
  showTrans,
  setShowTrans,
}: {
  dialogues: DialogueBlock[];
  showTrans: boolean;
  setShowTrans: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Toggle
          on={showTrans}
          onClick={() => setShowTrans(!showTrans)}
          label={showTrans ? L.hideTranslation : L.showTranslation}
        />
      </div>
      <div className="space-y-6">
        {dialogues.map((d) => (
          <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 font-korean font-semibold text-slate-900">{d.title}</h3>
            <ul className="space-y-3">
              {d.lines.map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 font-korean text-xs font-semibold text-brand-700">
                    {line.speaker}
                  </span>
                  <div>
                    <p className="font-korean text-slate-900">{line.kr}</p>
                    {showTrans && <p className="text-sm text-slate-500">{line.vi}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
