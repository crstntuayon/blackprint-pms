import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    node_version: process.version,
    platform: process.platform,
  };

  // Check env vars
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

  // Try loading Prisma module dynamically
  try {
    const dbModule = await import("@/lib/db");
    checks.prisma_module_loaded = true;
    checks.prisma_export_keys = Object.keys(dbModule);
  } catch (err: any) {
    checks.prisma_module_loaded = false;
    checks.prisma_module_error = err?.message || String(err);
    checks.prisma_module_stack = err?.stack?.split("\n")?.slice(0, 5) || "no stack";
  }

  // If Prisma loaded, try a simple query
  if (checks.prisma_module_loaded) {
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.$queryRaw`SELECT 1`;
      checks.database_connected = true;
    } catch (err: any) {
      checks.database_connected = false;
      checks.database_error = err?.message || String(err);
    }
  }

  return NextResponse.json(checks);
}
