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
    const { name, category, quantity, unit, minStock, cost, supplier } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (quantity !== undefined) data.quantity = parseInt(quantity);
    if (unit !== undefined) data.unit = unit;
    if (minStock !== undefined) data.minStock = parseInt(minStock);
    if (cost !== undefined) data.cost = parseFloat(cost);
    if (supplier !== undefined) data.supplier = supplier || null;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
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
    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 });
  }
}
