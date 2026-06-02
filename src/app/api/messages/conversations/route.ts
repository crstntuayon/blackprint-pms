import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserId = session.user.id;

  try {
    // Get all messages where current user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by conversation partner
    const partnerMap = new Map<string, { lastMessage: typeof messages[0]; unreadCount: number }>();

    for (const msg of messages) {
      const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      const existing = partnerMap.get(partnerId);

      if (!existing) {
        partnerMap.set(partnerId, {
          lastMessage: msg,
          unreadCount: msg.receiverId === currentUserId && !msg.read ? 1 : 0,
        });
      } else if (msg.receiverId === currentUserId && !msg.read) {
        existing.unreadCount += 1;
      }
    }

    // Fetch partner user details
    const partnerIds = Array.from(partnerMap.keys());
    const users = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true, username: true, role: true },
    });

    const conversations = users.map((user) => {
      const data = partnerMap.get(user.id)!;
      return {
        userId: user.id,
        name: user.name || user.username,
        username: user.username,
        role: user.role,
        lastMessage: data.lastMessage.content,
        lastMessageAt: data.lastMessage.createdAt,
        unreadCount: data.unreadCount,
      };
    });

    // Sort by most recent message
    conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
