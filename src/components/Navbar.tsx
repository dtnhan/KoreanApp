import { auth } from "@/lib/auth";
import { NavbarClient } from "@/components/NavbarClient";

export async function Navbar() {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? session.user.email ?? "Bạn",
        role: session.user.role,
      }
    : null;

  return <NavbarClient user={user} />;
}
