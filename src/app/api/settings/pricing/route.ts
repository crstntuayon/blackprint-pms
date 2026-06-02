import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPricing, setPricing } from "@/lib/pricing";

export async function GET() {
  try {
    const pricing = await getPricing();
    return NextResponse.json(pricing);
  } catch {
    return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const pricing = await setPricing(body);
    return NextResponse.json(pricing);
  } catch {
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
  }
}
