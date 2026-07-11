import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { labels } from "@/lib/labels";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: labels.auth.registerTitle };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <AuthCard title={labels.auth.registerTitle}>
      <RegisterForm />
    </AuthCard>
  );
}
