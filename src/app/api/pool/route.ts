import { askPool } from "@/lib/pool";
import { handle, requireCan } from "@/lib/session";

export const POST = handle(async (req: Request) => {
  const s = await requireCan("query");
  const { query } = await req.json();
  if (!query?.trim() || query.length > 500) throw new Error("Describe who you are looking for (max 500 characters).");
  return Response.json(await askPool(query.trim(), s.email));
});
