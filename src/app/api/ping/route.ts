export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      time: new Date().toISOString(),
      node: process.version,
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
