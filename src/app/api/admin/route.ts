import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, username: true },
      take: 1,
    });

    if (admins.length === 0) {
      return NextResponse.json({ error: "No admin found" }, { status: 404 });
    }

    return NextResponse.json(admins[0]);
  } catch {
    return NextResponse.json({ error: "Failed to fetch admin" }, { status: 500 });
  }
}
