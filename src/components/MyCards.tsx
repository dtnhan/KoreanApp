"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createCustomCard,
  updateCustomCard,
  deleteCustomCard,
} from "@/actions/custom-cards";
import type { AdminFormState } from "@/lib/admin-form";
import { labels } from "@/lib/labels";
import { AudioButton } from "@/components/AudioButton";

const M = labels.myCards;

export type CustomCard = {
  id: string;
  korean: string;
  romanization: string | null;
  vietnamese: string;
  exampleKr: string | null;
  exampleVi: string | null;
};

function Field({
  label,
  name,
  defaultValue,
  error,
  required,
  optional,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  error?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {optional && <span className="ml-1 font-normal normal-case text-slate-400">{M.optional}</span>}
      </label>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-brand-500/30 ${
          error ? "border-red-400" : "border-slate-300 focus:border-brand-500"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/** Form dùng chung cho tạo mới và sửa. */
function CardForm({
  action,
  card,
  onDone,
  submitLabel,
}: {
  action: (prev: AdminFormState, fd: FormData) => Promise<AdminFormState>;
  card?: CustomCard;
  onDone?: () => void;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      if (onDone) onDone();
      else formRef.current?.reset();
    }
  }, [state, onDone]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <Field label={M.korean} name="korean" defaultValue={card?.korean} error={state.fieldErrors?.korean} required />
      <Field label={M.romanization} name="romanization" defaultValue={card?.romanization} error={state.fieldErrors?.romanization} optional />
      <Field label={M.vietnamese} name="vietnamese" defaultValue={card?.vietnamese} error={state.fieldErrors?.vietnamese} required />
      <div className="hidden sm:block" />
      <Field label={M.exampleKr} name="exampleKr" defaultValue={card?.exampleKr} error={state.fieldErrors?.exampleKr} optional />
      <Field label={M.exampleVi} name="exampleVi" defaultValue={card?.exampleVi} error={state.fieldErrors?.exampleVi} optional />

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? M.saving : submitLabel}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
          >
            {M.cancel}
          </button>
        )}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(M.deleteConfirm)) {
          startTransition(async () => {
            await deleteCustomCard(id);
          });
        }
      }}
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
    >
      {pending ? "..." : M.delete}
    </button>
  );
}

function CardRow({ card }: { card: CustomCard }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
        <CardForm
          action={updateCustomCard.bind(null, card.id)}
          card={card}
          onDone={() => setEditing(false)}
          submitLabel={M.save}
        />
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-korean text-lg font-semibold text-slate-900">{card.korean}</span>
          <AudioButton text={card.korean} />
          {card.romanization && (
            <span className="text-sm italic text-slate-400">{card.romanization}</span>
          )}
        </div>
        <p className="mt-0.5 text-slate-700">{card.vietnamese}</p>
        {card.exampleKr && (
          <p className="font-korean mt-1 text-sm text-slate-500">{card.exampleKr}</p>
        )}
        {card.exampleVi && <p className="text-sm text-slate-400">{card.exampleVi}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          {M.edit}
        </button>
        <DeleteButton id={card.id} />
      </div>
    </li>
  );
}

export function MyCards({ cards }: { cards: CustomCard[] }) {
  return (
    <div className="mt-6 space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">{M.create}</h2>
        <div className="mt-4">
          <CardForm action={createCustomCard} submitLabel={M.save} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{M.count(cards.length)}</h2>
          {cards.length > 0 && (
            <Link
              href="/on-tap"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {M.reviewNow}
            </Link>
          )}
        </div>

        {cards.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {M.empty}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {cards.map((c) => (
              <CardRow key={c.id} card={c} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
