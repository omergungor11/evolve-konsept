function unavailable() {
  return Response.json({ success: false, local: true, error: "This local preview does not send data to a live service." }, { status: 503 });
}

export const GET = unavailable;
export const POST = unavailable;
