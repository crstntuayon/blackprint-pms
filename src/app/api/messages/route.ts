import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Fetch conversation between current user and another user
export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("with");

  if (!withUserId) {
    return NextResponse.json({ error: "Missing 'with' parameter" }, { status: 400 });
  }

  const currentUserId = session.user.id;

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: withUserId },
          { senderId: withUserId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    // Mark messages from the other user as read
    await prisma.message.updateMany({
      where: {
        senderId: withUserId,
        receiverId: currentUserId,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// Send a message
export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    if (!session.user.id) {
      return NextResponse.json({ error: "Session invalid. Please sign out and sign in again." }, { status: 401 });
    }

    if (!(prisma as any).message) {
      console.error("[API DIAGNOSTIC] prisma.message is undefined at request time");
      return NextResponse.json(
        { error: "Database model not loaded. Please restart the dev server." },
        { status: 500 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
    });

    return NextResponse.json(message);
  } catch (err: any) {
    console.error("Message send error:", err);
    return NextResponse.json(
      { error: "Failed to send message", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
