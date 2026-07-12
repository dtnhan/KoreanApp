"use client";

import { useTransition } from "react";
import { labels } from "@/lib/labels";

const A = labels.admin;

export function AdminField({
  label,
  name,
  defaultValue,
  error,
  type = "text",
  textarea = false,
  required = false,
  className,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  error?: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const base = `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-brand-500/30 ${
    error ? "border-red-400" : "border-slate-300 focus:border-brand-500"
  }`;
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          rows={3}
          className={`mt-1 ${base}`}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className={`mt-1 ${base}`}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function SubmitButton({ pending, label }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? A.saving : (label ?? A.save)}
    </button>
  );
}

export function DeleteButton({
  id,
  action,
  confirmText,
  className,
  label,
}: {
  id: string;
  action: (id: string) => Promise<void>;
  confirmText: string;
  className?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) {
          startTransition(async () => {
            await action(id);
          });
        }
      }}
      className={
        className ??
        "rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
      }
    >
      {pending ? "..." : (label ?? A.delete)}
    </button>
  );
}

export function FormMessage({
  success,
  error,
}: {
  success?: boolean;
  error?: string;
}) {
  if (error) {
    return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }
  if (success) {
    return <p className="text-sm font-medium text-emerald-600">{A.saved}</p>;
  }
  return null;
}
