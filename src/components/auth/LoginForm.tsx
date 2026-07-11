"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginUser, loginWithGoogle, type AuthFormState } from "@/actions/auth";
import { labels } from "@/lib/labels";
import { Field } from "@/components/auth/AuthCard";

const A = labels.auth;

export function LoginForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginUser,
    {},
  );

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field label={A.email} name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} />
        <Field label={A.password} name="password" type="password" autoComplete="current-password" error={state.fieldErrors?.password} />

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Đang đăng nhập..." : A.loginButton}
        </button>
      </form>

      {googleEnabled && (
        <form action={loginWithGoogle} className="mt-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {A.loginWithGoogle}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        {A.noAccount}{" "}
        <Link href="/dang-ky" className="font-semibold text-brand-600 hover:text-brand-700">
          {labels.nav.register}
        </Link>
      </p>
    </div>
  );
}
