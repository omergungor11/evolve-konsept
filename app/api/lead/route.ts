/** Complete the local demonstration without storing or forwarding personal data. */
export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try { data = await request.json(); } catch {
    return Response.json({ success: false, local: true, error: "Invalid form data." }, { status: 400 });
  }
  if (typeof data.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return Response.json({ success: false, local: true, error: "A valid email is required." }, { status: 400 });
  }
  return Response.json({ success: true, local: true, delivered: false, message: "Validated locally. No information was stored or sent." });
}
