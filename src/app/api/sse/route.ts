import { auth } from "@/lib/auth";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      const interval = setInterval(async () => {
        try {
          const updates = await redis.lrange(`user-updates:${userId}`, 0, -1);
          if (updates && updates.length > 0) {
            for (const update of updates) {
              controller.enqueue(
                encoder.encode(`data: ${update}\n\n`)
              );
            }
            await redis.del(`user-updates:${userId}`);
          }
        } catch (error) {
          console.error("SSE polling error:", error);
        }
      }, 3000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
