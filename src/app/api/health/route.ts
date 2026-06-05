import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
  };

  // Check env vars (safe, no DB needed)
  checks.env = {
    database_url_set: !!process.env.DATABASE_URL,
    database_url_host: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/mysql:\/\/[^:]+:[^@]+@/, "mysql://***:***@")
      : "NOT SET",
    redis_url_set: !!process.env.UPSTASH_REDIS_REST_URL,
    nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
    nextauth_url: process.env.NEXTAUTH_URL || "NOT SET",
    node_env: process.env.NODE_ENV || "NOT SET",
  };

  // Try to load Prisma dynamically so we don't crash if the module fails
  try {
    const { prisma } = await import("@/lib/db");
    checks.prisma_module_loaded = true;

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database_connected = true;
    } catch (err: any) {
      checks.database_connected = false;
      checks.database_error = err?.message || String(err);
    }

    try {
      const userCount = await prisma.user.count();
      checks.user_count = userCount;
    } catch (err: any) {
      checks.user_count_error = err?.message || String(err);
    }
  } catch (err: any) {
    checks.prisma_module_loaded = false;
    checks.prisma_module_error = err?.message || String(err);
  }

  return NextResponse.json(checks);
}
