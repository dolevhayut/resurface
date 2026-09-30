import { importFiles } from "@/lib/importer";
import { handle, requireCan } from "@/lib/session";

export const POST = handle(async (req: Request) => {
  const s = await requireCan("import");
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) throw new Error("No files uploaded");
  return Response.json(await importFiles(files, s.email));
});
