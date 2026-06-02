import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPricing, calculateCost, calculateDetailedCost } from "@/lib/pricing";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { PDFDocument } from "pdf-lib";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function countPages(file: File): Promise<number> {
  try {
    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(bytes);
    return pdfDoc.getPageCount();
  } catch {
    return 1;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const pages = await countPages(file);
    const copies = parseInt(formData.get("copies") as string) || 1;
    const color = formData.get("color") === "true";
    const duplex = formData.get("duplex") === "true";
    const paymentMethod = formData.get("paymentMethod") as string | null;
    const photoPages = parseInt(formData.get("photoPages") as string) || 0;
    const paperSize = (formData.get("paperSize") as string) || "A4";
    const pickupAtRaw = formData.get("pickupAt") as string | null;

    let pickupAt: Date | undefined;
    if (pickupAtRaw) {
      pickupAt = new Date(pickupAtRaw);
      const now = new Date();
      // Round down now to the nearest minute for fair comparison
      now.setSeconds(0, 0);
      if (isNaN(pickupAt.getTime()) || pickupAt < now) {
        return NextResponse.json({ error: "Pickup time must be in the future" }, { status: 400 });
      }
    }

    // Recalculate cost server-side using actual page count and photo/text breakdown
    const pricing = await getPricing();
    const size = (paperSize as "SHORT" | "LONG" | "A4") || "A4";
    let totalCost: number;
    if (!color) {
      totalCost = calculateCost(pages, copies, size, false, duplex, pricing);
    } else {
      const textPg = Math.max(0, pages - photoPages);
      totalCost = calculateDetailedCost(textPg, photoPages, copies, size, duplex, pricing);
    }

    const job = await prisma.printJob.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileUrl: `/uploads/${fileName}`,
        fileSize: file.size,
        pages,
        copies,
        color,
        duplex,
        paperSize,
        totalCost,
        status: "PENDING",
        paymentMethod: paymentMethod === "E_WALLET" || paymentMethod === "CASH" ? paymentMethod : undefined,
        pickupAt: pickupAt || undefined,
      },
    });

    await redis.lpush("print-queue", JSON.stringify({
      jobId: job.id,
      userId: session.user.id,
      timestamp: Date.now(),
    }));

    return NextResponse.json({ jobId: job.id, status: "queued", pages });
  } catch (error) {
    console.error("Print job error:", error);
    return NextResponse.json(
      { error: "Failed to create print job" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");

  if (scope === "admin" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where = scope === "admin" ? {} : { userId: session.user.id };

  const jobs = await prisma.printJob.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: scope === "admin" ? { user: { select: { name: true, email: true } } } : undefined,
  });

  return NextResponse.json(jobs);
}
