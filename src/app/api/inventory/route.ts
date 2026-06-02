import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, category, quantity, unit, minStock, cost, supplier } = body;

    if (!name || !category || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        quantity: parseInt(quantity) || 0,
        unit,
        minStock: parseInt(minStock) || 10,
        cost: cost ? parseFloat(cost) : 0,
        supplier: supplier || null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
  }
}
