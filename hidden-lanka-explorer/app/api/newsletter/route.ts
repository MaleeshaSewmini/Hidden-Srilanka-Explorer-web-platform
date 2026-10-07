export async function GET() {
  return Response.json({ ok: true, message: "Newsletter endpoint ready." });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  return Response.json({
    ok: true,
    received: body,
    message: "Newsletter endpoint ready.",
  });
}
