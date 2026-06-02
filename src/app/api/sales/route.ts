import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30"; // days
    const days = parseInt(range) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Overall totals
    const allTimeRevenue = await prisma.printJob.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalCost: true },
    });

    const totalJobs = await prisma.printJob.count();
    const completedJobs = await prisma.printJob.count({ where: { status: "COMPLETED" } });
    const paidJobs = await prisma.printJob.count({ where: { paymentStatus: "PAID" } });

    const periodRevenue = await prisma.printJob.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startDate },
      },
      _sum: { totalCost: true },
    });

    const periodJobs = await prisma.printJob.count({
      where: { createdAt: { gte: startDate } },
    });

    // Daily breakdown
    const dailyRaw = await prisma.printJob.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: startDate } },
      _sum: { totalCost: true },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap = new Map<string, { revenue: number; jobs: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, { revenue: 0, jobs: 0 });
    }

    for (const row of dailyRaw) {
      const key = row.createdAt.toISOString().split("T")[0];
      if (dailyMap.has(key)) {
        dailyMap.set(key, {
          revenue: Number(row._sum.totalCost || 0),
          jobs: row._count.id,
        });
      }
    }

    const daily = Array.from(dailyMap.entries())
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Print options breakdown
    const colorBw = await prisma.$queryRaw<
      { color: number; duplex: number; _count: bigint; _sum: number }[]
    >`
      SELECT color, duplex, COUNT(*) as _count, SUM(totalCost) as _sum
      FROM PrintJob
      WHERE createdAt >= ${startDate}
      GROUP BY color, duplex
    `;

    // Payment method breakdown
    const paymentMethodRaw = await prisma.$queryRaw<
      { paymentMethod: string | null; _count: bigint; _sum: number }[]
    >`
      SELECT paymentMethod, COUNT(*) as _count, SUM(totalCost) as _sum
      FROM PrintJob
      WHERE createdAt >= ${startDate}
      GROUP BY paymentMethod
    `;

    // Top clients
    const topClientsRaw = await prisma.printJob.groupBy({
      by: ["userId"],
      where: { paymentStatus: "PAID", createdAt: { gte: startDate } },
      _sum: { totalCost: true },
      _count: { id: true },
      orderBy: { _sum: { totalCost: "desc" } },
      take: 5,
    });

    const userIds = topClientsRaw.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true, email: true },
    });

    const topClients = topClientsRaw.map((r) => {
      const u = users.find((x) => x.id === r.userId);
      return {
        name: u?.name || u?.username || u?.email || "Unknown",
        revenue: Number(r._sum.totalCost || 0),
        jobs: r._count.id,
      };
    });

    return NextResponse.json({
      summary: {
        allTimeRevenue: Number(allTimeRevenue._sum.totalCost || 0),
        periodRevenue: Number(periodRevenue._sum.totalCost || 0),
        totalJobs,
        completedJobs,
        paidJobs,
        periodJobs,
      },
      daily,
      optionsBreakdown: colorBw.map((r) => ({
        color: r.color === 1,
        duplex: r.duplex === 1,
        count: Number(r._count),
        revenue: Number(r._sum),
      })),
      paymentMethodBreakdown: paymentMethodRaw.map((r) => ({
        method: r.paymentMethod || "Not Selected",
        count: Number(r._count),
        revenue: Number(r._sum),
      })),
      topClients,
    });
  } catch (error) {
    console.error("Sales API error:", error);
    return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
  }
}
