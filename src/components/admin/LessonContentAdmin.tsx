"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  saveVocab,
  deleteVocab,
  saveGrammar,
  deleteGrammar,
  saveDialogue,
  deleteDialogue,
  saveQuestion,
  deleteQuestion,
  generateQuestions,
  generateDialogue,
} from "@/actions/admin/content";
import type { AdminFormState } from "@/lib/admin-form";
import { labels } from "@/lib/labels";
import {
  AdminField,
  SubmitButton,
  DeleteButton,
  FormMessage,
} from "@/components/admin/ui";

const A = labels.admin;

// ---------- Kiểu dữ liệu ----------

export type VocabItem = {
  id: string;
  korean: string;
  romanization: string | null;
  vietnamese: string;
  exampleKr: string | null;
  exampleVi: string | null;
  audioUrl: string | null;
  order: number;
};
export type GrammarItem = {
  id: string;
  pattern: string;
  explanation: string;
  examples: { kr: string; vi: string }[];
  order: number;
};
export type DialogueItem = {
  id: string;
  title: string;
  lines: { speaker: string; kr: string; vi: string }[];
  order: number;
};
export type QuestionItem = {
  id: string;
  type: "MCQ_KR_VN" | "MCQ_VN_KR" | "FILL_BLANK";
  prompt: string;
  options: string[];
  answer: string;
  explanation: string | null;
  order: number;
};

// ---------- Tabs ----------

type TabKey = "vocab" | "grammar" | "dialogue" | "question";

export function LessonContentAdmin({
  lessonId,
  vocab,
  grammar,
  dialogues,
  questions,
}: {
  lessonId: string;
  vocab: VocabItem[];
  grammar: GrammarItem[];
  dialogues: DialogueItem[];
  questions: QuestionItem[];
}) {
  const [tab, setTab] = useState<TabKey>("vocab");
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "vocab", label: A.vocab, count: vocab.length },
    { key: "grammar", label: A.grammar, count: grammar.length },
    { key: "dialogue", label: A.dialogues, count: dialogues.length },
    { key: "question", label: A.questions, count: questions.length },
  ];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
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
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "vocab" && <VocabAdmin lessonId={lessonId} items={vocab} />}
        {tab === "grammar" && <GrammarAdmin lessonId={lessonId} items={grammar} />}
        {tab === "dialogue" && <DialogueAdmin lessonId={lessonId} items={dialogues} />}
        {tab === "question" && <QuestionAdmin lessonId={lessonId} items={questions} />}
      </div>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
    >
      + {label}
    </button>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
    >
      {A.edit}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
    >
      {A.cancel}
    </button>
  );
}

/** Đóng form sau khi lưu thành công. */
function useCloseOnSuccess(state: AdminFormState, onDone: () => void) {
  useEffect(() => {
    if (state.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

// ==================== TỪ VỰNG ====================

function VocabAdmin({ lessonId, items }: { lessonId: string; items: VocabItem[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-4">
      {editing === "new" ? (
        <VocabForm lessonId={lessonId} nextOrder={items.length + 1} onDone={() => setEditing(null)} />
      ) : (
        <AddButton onClick={() => setEditing("new")} label={A.vocab} />
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5 font-semibold">#</th>
              <th className="px-3 py-2.5 font-semibold">{labels.lesson.korean}</th>
              <th className="px-3 py-2.5 font-semibold">{labels.lesson.meaning}</th>
              <th className="px-3 py-2.5 font-semibold">{labels.lesson.romanization}</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <VocabRow
                key={v.id}
                item={v}
                lessonId={lessonId}
                editing={editing === v.id}
                onEdit={() => setEditing(v.id)}
                onDone={() => setEditing(null)}
              />
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Chưa có từ vựng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VocabRow({
  item,
  lessonId,
  editing,
  onEdit,
  onDone,
}: {
  item: VocabItem;
  lessonId: string;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}) {
  if (editing) {
    return (
      <tr>
        <td colSpan={5} className="px-3 py-3">
          <VocabForm lessonId={lessonId} item={item} onDone={onDone} />
        </td>
      </tr>
    );
  }
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-3 py-2.5 text-slate-400">{item.order}</td>
      <td className="font-korean px-3 py-2.5 font-semibold text-slate-900">{item.korean}</td>
      <td className="px-3 py-2.5 text-slate-700">{item.vietnamese}</td>
      <td className="px-3 py-2.5 italic text-slate-500">{item.romanization ?? "—"}</td>
      <td className="px-3 py-2.5">
        <div className="flex justify-end gap-2">
          <EditButton onClick={onEdit} />
          <DeleteButton id={item.id} action={deleteVocab} confirmText={A.confirmDeleteItem} />
        </div>
      </td>
    </tr>
  );
}

function VocabForm({
  lessonId,
  item,
  nextOrder,
  onDone,
}: {
  lessonId: string;
  item?: VocabItem;
  nextOrder?: number;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(saveVocab, {});
  useCloseOnSuccess(state, onDone);

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4 sm:grid-cols-3">
      <input type="hidden" name="lessonId" value={lessonId} />
      {item && <input type="hidden" name="id" value={item.id} />}

      <AdminField label={labels.lesson.korean} name="korean" defaultValue={item?.korean} error={state.fieldErrors?.korean} required />
      <AdminField label={labels.lesson.romanization} name="romanization" defaultValue={item?.romanization ?? ""} error={state.fieldErrors?.romanization} />
      <AdminField label={labels.lesson.meaning} name="vietnamese" defaultValue={item?.vietnamese} error={state.fieldErrors?.vietnamese} required />
      <AdminField label="Ví dụ (Hàn)" name="exampleKr" defaultValue={item?.exampleKr ?? ""} error={state.fieldErrors?.exampleKr} />
      <AdminField label="Ví dụ (Việt)" name="exampleVi" defaultValue={item?.exampleVi ?? ""} error={state.fieldErrors?.exampleVi} />
      <AdminField label={A.audioUrl} name="audioUrl" defaultValue={item?.audioUrl ?? ""} error={state.fieldErrors?.audioUrl} placeholder="https://.../tu-vung.mp3" />
      <AdminField label={A.order} name="order" type="number" defaultValue={item?.order ?? nextOrder ?? 1} error={state.fieldErrors?.order} required />

      <div className="flex items-center gap-2 sm:col-span-3">
        <SubmitButton pending={pending} />
        <CancelButton onClick={onDone} />
        <FormMessage error={state.error} />
      </div>
    </form>
  );
}

// ==================== NGỮ PHÁP ====================

function GrammarAdmin({ lessonId, items }: { lessonId: string; items: GrammarItem[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-4">
      {editing === "new" ? (
        <GrammarForm lessonId={lessonId} nextOrder={items.length + 1} onDone={() => setEditing(null)} />
      ) : (
        <AddButton onClick={() => setEditing("new")} label={A.grammar} />
      )}

      {items.map((g) =>
        editing === g.id ? (
          <GrammarForm key={g.id} lessonId={lessonId} item={g} onDone={() => setEditing(null)} />
        ) : (
          <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-korean font-bold text-brand-700">
                  <span className="mr-2 text-xs font-normal text-slate-400">#{g.order}</span>
                  {g.pattern}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{g.explanation}</p>
                <p className="mt-1 text-xs text-slate-400">{g.examples.length} ví dụ</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <EditButton onClick={() => setEditing(g.id)} />
                <DeleteButton id={g.id} action={deleteGrammar} confirmText={A.confirmDeleteItem} />
              </div>
            </div>
          </div>
        ),
      )}
      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          Chưa có điểm ngữ pháp nào.
        </p>
      )}
    </div>
  );
}

function GrammarForm({
  lessonId,
  item,
  nextOrder,
  onDone,
}: {
  lessonId: string;
  item?: GrammarItem;
  nextOrder?: number;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(saveGrammar, {});
  const [examples, setExamples] = useState<{ kr: string; vi: string }[]>(
    item?.examples?.length ? item.examples : [{ kr: "", vi: "" }],
  );
  useCloseOnSuccess(state, onDone);

  function setExample(i: number, key: "kr" | "vi", value: string) {
    setExamples((ex) => ex.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)));
  }

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <input type="hidden" name="lessonId" value={lessonId} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="examplesJson" value={JSON.stringify(examples)} />

      <div className="grid gap-3 sm:grid-cols-4">
        <AdminField label={labels.lesson.pattern} name="pattern" defaultValue={item?.pattern} error={state.fieldErrors?.pattern} required className="sm:col-span-3" />
        <AdminField label={A.order} name="order" type="number" defaultValue={item?.order ?? nextOrder ?? 1} error={state.fieldErrors?.order} required />
      </div>
      <AdminField label={labels.lesson.explanation} name="explanation" textarea defaultValue={item?.explanation} error={state.fieldErrors?.explanation} required />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ví dụ (Hàn / Việt)
        </p>
        {state.fieldErrors?.examples && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.examples}</p>
        )}
        <div className="mt-2 space-y-2">
          {examples.map((ex, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={ex.kr}
                onChange={(e) => setExample(i, "kr", e.target.value)}
                placeholder="예: 저는 학생이에요."
                className="font-korean w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <input
                value={ex.vi}
                onChange={(e) => setExample(i, "vi", e.target.value)}
                placeholder="Ví dụ: Tôi là học sinh."
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setExamples((exs) => exs.filter((_, idx) => idx !== i))}
                disabled={examples.length <= 1}
                className="shrink-0 rounded-lg border border-slate-200 px-2.5 text-sm text-slate-400 transition hover:text-red-600 disabled:opacity-40"
                aria-label="Xóa dòng"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExamples((exs) => [...exs, { kr: "", vi: "" }])}
          className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          + Thêm cặp ví dụ
        </button>
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton pending={pending} />
        <CancelButton onClick={onDone} />
        <FormMessage error={state.error} />
      </div>
    </form>
  );
}

// ==================== HỘI THOẠI ====================

function GenerateDialogueButton({ lessonId }: { lessonId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await generateDialogue(lessonId);
            setMessage(res.created > 0 ? A.generatedDialogue : A.nothingDialogue);
          })
        }
        className="rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
      >
        {pending ? A.generating : `⚡ ${A.autoGenerateDialogue}`}
      </button>
      {message && !pending && (
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          {message}
        </span>
      )}
    </span>
  );
}

function DialogueAdmin({ lessonId, items }: { lessonId: string; items: DialogueItem[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-4">
      {editing === "new" ? (
        <DialogueForm lessonId={lessonId} nextOrder={items.length + 1} onDone={() => setEditing(null)} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <AddButton onClick={() => setEditing("new")} label={A.dialogues} />
          <GenerateDialogueButton lessonId={lessonId} />
        </div>
      )}

      {items.map((d) =>
        editing === d.id ? (
          <DialogueForm key={d.id} lessonId={lessonId} item={d} onDone={() => setEditing(null)} />
        ) : (
          <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-korean font-semibold text-slate-900">
                  <span className="mr-2 text-xs font-normal text-slate-400">#{d.order}</span>
                  {d.title}
                </p>
                <p className="mt-1 text-xs text-slate-400">{d.lines.length} dòng hội thoại</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <EditButton onClick={() => setEditing(d.id)} />
                <DeleteButton id={d.id} action={deleteDialogue} confirmText={A.confirmDeleteItem} />
              </div>
            </div>
          </div>
        ),
      )}
      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          Chưa có hội thoại nào.
        </p>
      )}
    </div>
  );
}

function DialogueForm({
  lessonId,
  item,
  nextOrder,
  onDone,
}: {
  lessonId: string;
  item?: DialogueItem;
  nextOrder?: number;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(saveDialogue, {});
  const [lines, setLines] = useState<{ speaker: string; kr: string; vi: string }[]>(
    item?.lines?.length ? item.lines : [{ speaker: "", kr: "", vi: "" }],
  );
  useCloseOnSuccess(state, onDone);

  function setLine(i: number, key: "speaker" | "kr" | "vi", value: string) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)));
  }

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <input type="hidden" name="lessonId" value={lessonId} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />

      <div className="grid gap-3 sm:grid-cols-4">
        <AdminField label={A.title} name="title" defaultValue={item?.title} error={state.fieldErrors?.title} required className="sm:col-span-3" />
        <AdminField label={A.order} name="order" type="number" defaultValue={item?.order ?? nextOrder ?? 1} error={state.fieldErrors?.order} required />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Các dòng hội thoại (Người nói / Hàn / Việt)
        </p>
        {state.fieldErrors?.lines && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.lines}</p>
        )}
        <div className="mt-2 space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={l.speaker}
                onChange={(e) => setLine(i, "speaker", e.target.value)}
                placeholder="민수"
                className="font-korean w-24 shrink-0 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-brand-500"
              />
              <input
                value={l.kr}
                onChange={(e) => setLine(i, "kr", e.target.value)}
                placeholder="안녕하세요!"
                className="font-korean w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <input
                value={l.vi}
                onChange={(e) => setLine(i, "vi", e.target.value)}
                placeholder="Xin chào!"
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                disabled={lines.length <= 1}
                className="shrink-0 rounded-lg border border-slate-200 px-2.5 text-sm text-slate-400 transition hover:text-red-600 disabled:opacity-40"
                aria-label="Xóa dòng"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLines((ls) => [...ls, { speaker: "", kr: "", vi: "" }])}
          className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          + Thêm dòng
        </button>
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton pending={pending} />
        <CancelButton onClick={onDone} />
        <FormMessage error={state.error} />
      </div>
    </form>
  );
}

// ==================== CÂU HỎI ====================

const TYPE_LABELS: Record<QuestionItem["type"], string> = {
  MCQ_KR_VN: "Trắc nghiệm Hàn → Việt",
  MCQ_VN_KR: "Trắc nghiệm Việt → Hàn",
  FILL_BLANK: "Điền vào chỗ trống",
};

function GenerateQuestionsButton({ lessonId }: { lessonId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await generateQuestions(lessonId);
            setMessage(
              res.created > 0 ? A.generated(res.created) : A.nothingToGenerate,
            );
          })
        }
        className="rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
      >
        {pending ? A.generating : `⚡ ${A.autoGenerate}`}
      </button>
      {message && !pending && (
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          {message}
        </span>
      )}
    </span>
  );
}

function QuestionAdmin({ lessonId, items }: { lessonId: string; items: QuestionItem[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="space-y-4">
      {editing === "new" ? (
        <QuestionForm lessonId={lessonId} nextOrder={items.length + 1} onDone={() => setEditing(null)} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <AddButton onClick={() => setEditing("new")} label={A.questions} />
          <GenerateQuestionsButton lessonId={lessonId} />
        </div>
      )}

      {items.map((q) =>
        editing === q.id ? (
          <QuestionForm key={q.id} lessonId={lessonId} item={q} onDone={() => setEditing(null)} />
        ) : (
          <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  #{q.order} · {TYPE_LABELS[q.type]}
                </p>
                <p className="font-korean mt-1 font-semibold text-slate-900">{q.prompt}</p>
                <p className="font-korean mt-1 text-sm text-emerald-700">Đáp án: {q.answer}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <EditButton onClick={() => setEditing(q.id)} />
                <DeleteButton id={q.id} action={deleteQuestion} confirmText={A.confirmDeleteItem} />
              </div>
            </div>
          </div>
        ),
      )}
      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          Chưa có câu hỏi nào.
        </p>
      )}
    </div>
  );
}

function QuestionForm({
  lessonId,
  item,
  nextOrder,
  onDone,
}: {
  lessonId: string;
  item?: QuestionItem;
  nextOrder?: number;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(saveQuestion, {});
  const [type, setType] = useState<QuestionItem["type"]>(item?.type ?? "MCQ_KR_VN");
  useCloseOnSuccess(state, onDone);

  const isMcq = type !== "FILL_BLANK";

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <input type="hidden" name="lessonId" value={lessonId} />
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Loại câu hỏi
          </label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as QuestionItem["type"])}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <AdminField label={A.order} name="order" type="number" defaultValue={item?.order ?? nextOrder ?? 1} error={state.fieldErrors?.order} required />
      </div>

      <AdminField label="Câu hỏi" name="prompt" textarea defaultValue={item?.prompt} error={state.fieldErrors?.prompt} required />

      {isMcq && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Các lựa chọn (tối thiểu 2)
          </p>
          {state.fieldErrors?.options && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.options}</p>
          )}
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <input
                key={n}
                name={`option${n}`}
                defaultValue={item?.options[n - 1] ?? ""}
                placeholder={`Lựa chọn ${n}`}
                className="font-korean rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            ))}
          </div>
        </div>
      )}

      <AdminField
        label={isMcq ? "Đáp án (phải trùng 1 lựa chọn)" : "Đáp án"}
        name="answer"
        defaultValue={item?.answer}
        error={state.fieldErrors?.answer}
        required
      />
      <AdminField label="Giải thích (tùy chọn)" name="explanation" textarea defaultValue={item?.explanation ?? ""} error={state.fieldErrors?.explanation} />

      <div className="flex items-center gap-2">
        <SubmitButton pending={pending} />
        <CancelButton onClick={onDone} />
        <FormMessage error={state.error} />
      </div>
    </form>
  );
}
