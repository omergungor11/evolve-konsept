import { routes } from "@/lib/reference";

export function GET() {
  return Response.json({ ok: true, mode: "offline", framework: "next", routes: routes.length });
}
