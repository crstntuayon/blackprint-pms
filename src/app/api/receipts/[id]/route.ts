import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const job = await prisma.printJob.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true, username: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Clients can only view their own receipts
    if (session.user.role !== "ADMIN" && job.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: "Failed to load receipt" }, { status: 500 });
  }
}
