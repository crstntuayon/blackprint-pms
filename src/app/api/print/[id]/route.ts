import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, paymentStatus, paymentMethod, printerId } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod === "E_WALLET" || paymentMethod === "CASH") updateData.paymentMethod = paymentMethod;
    if (paymentMethod === null) updateData.paymentMethod = null;
    if (printerId !== undefined) updateData.printerId = printerId;

    const job = await prisma.printJob.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.printJob.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
