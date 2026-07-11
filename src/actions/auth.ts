"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validation/auth";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Chỉ cho phép chuyển hướng nội bộ để tránh open redirect. */
function safeCallbackUrl(raw: unknown): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/";
}

export async function registerUser(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "Email này đã được đăng ký" } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "USER" },
  });

  // Tự động đăng nhập sau khi đăng ký (signIn ném NEXT_REDIRECT khi thành công)
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Đăng ký thành công nhưng đăng nhập tự động thất bại. Vui lòng đăng nhập." };
    }
    throw error; // NEXT_REDIRECT
  }
  return {};
}

export async function loginUser(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { email, password } = parsed.data;
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  // Tài khoản chỉ có Google (không có mật khẩu)
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.passwordHash) {
    return { error: "Tài khoản này đăng nhập bằng Google" };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email hoặc mật khẩu không đúng" };
    }
    throw error; // NEXT_REDIRECT khi thành công
  }
  return {};
}

export async function loginWithGoogle(formData: FormData) {
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));
  await signIn("google", { redirectTo: callbackUrl });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
