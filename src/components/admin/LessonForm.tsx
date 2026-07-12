"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveLesson } from "@/actions/admin/lessons";
import type { AdminFormState } from "@/lib/admin-form";
import { labels } from "@/lib/labels";
import { AdminField, SubmitButton, FormMessage } from "@/components/admin/ui";

const A = labels.admin;

type LessonData = { id: string; title: string; slug: string; order: number };

export function LessonForm({
  courseId,
  lesson,
}: {
  courseId: string;
  lesson?: LessonData;
}) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    saveLesson,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && !lesson) formRef.current?.reset();
  }, [state, lesson]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4"
    >
      <input type="hidden" name="courseId" value={courseId} />
      {lesson && <input type="hidden" name="id" value={lesson.id} />}

      <AdminField
        label={A.title}
        name="title"
        defaultValue={lesson?.title}
        error={state.fieldErrors?.title}
        required
        className="sm:col-span-2"
      />
      <AdminField
        label={A.slug}
        name="slug"
        defaultValue={lesson?.slug}
        error={state.fieldErrors?.slug}
        required
        placeholder="bai-4"
      />
      <AdminField
        label={A.order}
        name="order"
        type="number"
        defaultValue={lesson?.order}
        error={state.fieldErrors?.order}
        required
      />

      <div className="flex items-center gap-3 sm:col-span-4">
        <SubmitButton pending={pending} label={lesson ? A.save : A.add} />
        <FormMessage success={state.success} error={state.error} />
      </div>
    </form>
  );
}
