"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerUser, type AuthFormState } from "@/actions/auth";
import { labels } from "@/lib/labels";
import { Field } from "@/components/auth/AuthCard";

const A = labels.auth;

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    registerUser,
    {},
  );

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <Field label={A.name} name="name" autoComplete="name" error={state.fieldErrors?.name} />
        <Field label={A.email} name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} />
        <Field label={A.password} name="password" type="password" autoComplete="new-password" error={state.fieldErrors?.password} />
        <Field label={A.confirmPassword} name="confirmPassword" type="password" autoComplete="new-password" error={state.fieldErrors?.confirmPassword} />

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Đang đăng ký..." : A.registerButton}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {A.hasAccount}{" "}
        <Link href="/dang-nhap" className="font-semibold text-brand-600 hover:text-brand-700">
          {labels.nav.login}
        </Link>
      </p>
    </div>
  );
}
