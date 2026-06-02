import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const queueItems = await redis.lrange("print-queue", 0, 9);
    
    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    const processed = [];

    for (const item of queueItems) {
      const { jobId } = JSON.parse(item);
      
      await prisma.printJob.update({
        where: { id: jobId },
        data: { status: "PRINTING" },
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const updated = await prisma.printJob.update({
        where: { id: jobId },
        data: { 
          status: "COMPLETED",
          paymentStatus: "PAID",
          updatedAt: new Date(),
        },
      });

      await redis.lpush(
        `user-updates:${updated.userId}`,
        JSON.stringify({
          type: "job-update",
          jobId: updated.id,
          status: "COMPLETED",
        })
      );

      processed.push(jobId);
    }

    await redis.ltrim("print-queue", queueItems.length, -1);

    return NextResponse.json({ processed: processed.length, jobs: processed });
  } catch (error) {
    console.error("Queue processing error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}