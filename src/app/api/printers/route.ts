import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const printers = await prisma.printer.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(printers);
  } catch {
    return NextResponse.json({ error: "Failed to fetch printers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, model, location, ipAddress } = body;

    const printer = await prisma.printer.create({
      data: { name, model, location, ipAddress },
    });

    return NextResponse.json(printer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create printer" }, { status: 500 });
  }
}
