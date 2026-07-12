"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveCourse } from "@/actions/admin/courses";
import type { AdminFormState } from "@/lib/admin-form";
import { slugify } from "@/lib/slugify";
import { labels } from "@/lib/labels";
import { AdminField, SubmitButton, FormMessage } from "@/components/admin/ui";

const A = labels.admin;

type CourseData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
};

export function CourseForm({ course }: { course?: CourseData }) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    saveCourse,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [slugValue, setSlugValue] = useState(course?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!course);

  useEffect(() => {
    if (state.success && !course) {
      formRef.current?.reset();
      // Chủ đích: reset form sau khi tạo thành công
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlugValue("");
      setSlugTouched(false);
    }
  }, [state, course]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
    >
      {course && <input type="hidden" name="id" value={course.id} />}

      <AdminField
        label={A.title}
        name="title"
        defaultValue={course?.title}
        error={state.fieldErrors?.title}
        required
        className="sm:col-span-2"
      />
      {/* slug với auto-suggest từ tiêu đề */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {A.slug}
        </label>
        <input
          name="slug"
          value={slugValue}
          required
          onChange={(e) => {
            setSlugTouched(true);
            setSlugValue(e.target.value);
          }}
          onFocus={() => {
            if (!slugTouched && !slugValue) {
              const title =
                formRef.current?.querySelector<HTMLInputElement>('[name="title"]')?.value ?? "";
              setSlugValue(slugify(title));
            }
          }}
          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-brand-500/30 ${
            state.fieldErrors?.slug ? "border-red-400" : "border-slate-300 focus:border-brand-500"
          }`}
        />
        {state.fieldErrors?.slug && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.slug}</p>
        )}
      </div>
      <AdminField
        label={A.order}
        name="order"
        type="number"
        defaultValue={course?.order}
        error={state.fieldErrors?.order}
        required
      />
      <AdminField
        label={A.description}
        name="description"
        textarea
        defaultValue={course?.description}
        error={state.fieldErrors?.description}
        required
        className="sm:col-span-2"
      />

      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton pending={pending} label={course ? A.save : A.add} />
        <FormMessage success={state.success} error={state.error} />
      </div>
    </form>
  );
}
