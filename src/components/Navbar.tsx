import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { endOfTodayVN } from "@/lib/srs";
import { NavbarClient } from "@/components/NavbarClient";

export async function Navbar() {
  const session = await auth();

  let dueCount = 0;
  if (session?.user) {
    dueCount = await prisma.flashcard.count({
      where: { userId: session.user.id, dueDate: { lte: endOfTodayVN() } },
    });
  }

  const user = session?.user
    ? {
        name: session.user.name ?? session.user.email ?? "Bạn",
        role: session.user.role,
      }
    : null;

  return <NavbarClient user={user} dueCount={dueCount} />;
}
