import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

// Edit a message
export async function PATCH(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await _req.json().catch(() => ({}));
  const { content } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  try {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (existing.senderId !== session.user.id) {
      return NextResponse.json({ error: "Not allowed to edit this message" }, { status: 403 });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        content: content.trim(),
        edited: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Edit message error:", err);
    return NextResponse.json(
      { error: "Failed to edit message", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

// Delete a message
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (existing.senderId !== session.user.id) {
      return NextResponse.json({ error: "Not allowed to delete this message" }, { status: 403 });
    }

    await prisma.message.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete message error:", err);
    return NextResponse.json(
      { error: "Failed to delete message", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
