// app/api/ok/route.ts
export async function GET() {
  return new Response("OK", { status: 200 });
}
