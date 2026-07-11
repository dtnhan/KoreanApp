import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Bảo đảm đã đăng nhập. Nếu chưa, chuyển hướng tới /dang-nhap
 * (kèm callbackUrl nếu được cung cấp). Trả về session.user.
 */
export async function requireUser(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user) {
    const target = callbackUrl
      ? `/dang-nhap?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/dang-nhap";
    redirect(target);
  }
  return session.user;
}

/** Bảo đảm đã đăng nhập với vai trò ADMIN; nếu không, chuyển hướng. */
export async function requireAdmin(callbackUrl?: string) {
  const user = await requireUser(callbackUrl);
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
