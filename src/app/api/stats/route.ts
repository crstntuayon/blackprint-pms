import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [totalCustomers, totalDocuments, completedJobs] = await Promise.all([
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.printJob.count(),
      prisma.printJob.count({ where: { status: "COMPLETED" } }),
    ]);

    return NextResponse.json({
      totalCustomers,
      totalDocuments,
      completedJobs,
      turnaroundTime: "24h",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
