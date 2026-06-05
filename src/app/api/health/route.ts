import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const checks: Record<string, any> = {};

  // Check env vars
  checks.database_url_set = !!process.env.DATABASE_URL;
  checks.database_url_host = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/mysql:\/\/[^:]+:[^@]+@/, "mysql://***:***@")
    : "NOT SET";
  checks.redis_url_set = !!process.env.UPSTASH_REDIS_REST_URL;
  checks.nextauth_secret_set = !!process.env.NEXTAUTH_SECRET;

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database_connected = true;
  } catch (err: any) {
    checks.database_connected = false;
    checks.database_error = err?.message || String(err);
  }

  // Check tables
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()
    `;
    checks.tables = (tables as any[]).map((t) => t.table_name);
    checks.user_count = await prisma.user.count();
  } catch (err: any) {
    checks.tables_error = err?.message || String(err);
  }

  return NextResponse.json(checks);
}
