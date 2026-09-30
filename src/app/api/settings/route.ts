import { cookies } from "next/headers";
import { setProviderPreference } from "@/lib/providers";
import { audit, resetToSeed } from "@/lib/store";
import { handle, requireCan, session } from "@/lib/session";

export const POST = handle(async (req: Request) => {
  const b = await req.json();
  if (b.role) {
    (await cookies()).set("role", b.role, { path: "/", sameSite: "lax", httpOnly: true });
    return Response.json({ ok: true });
  }
  const s = await requireCan("settings");
  if (b.provider) {
    setProviderPreference(b.provider);
    audit(s.email, "settings.provider", b.provider);
  }
  if (b.reset) {
    resetToSeed();
    audit(s.email, "settings.reset_demo", "all");
  }
  void session;
  return Response.json({ ok: true });
});
