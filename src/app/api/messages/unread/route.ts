import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        read: false,
      },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}
