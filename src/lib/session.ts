import "server-only";
import { cookies } from "next/headers";
import type { Role } from "./types";

// MVP identity: a demo user per role, switchable in the header. Every server action and
// route still checks the role, so the permission model is exercised end to end.

export const USERS: Record<Role, { email: string; name: string }> = {
  admin: { email: "admin@demo", name: "Avery (Org admin)" },
  recruiter: { email: "recruiter@demo", name: "Rin (Recruiter)" },
  hiring_manager: { email: "hm@demo", name: "Harper (Hiring manager)" },
};

const CAN: Record<string, Role[]> = {
  import: ["admin"],
  delete: ["admin"],
  settings: ["admin"],
  editRubric: ["admin", "recruiter"],
  run: ["admin", "recruiter"],
  export: ["admin", "recruiter"],
  shortlist: ["admin", "recruiter", "hiring_manager"],
  query: ["admin", "recruiter"],
};

export async function session() {
  const role = ((await cookies()).get("role")?.value as Role) || "recruiter";
  const r: Role = role in USERS ? role : "recruiter";
  return { role: r, ...USERS[r], can: (action: keyof typeof CAN | string) => (CAN[action] ?? []).includes(r) };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireCan(action: string) {
  const s = await session();
  if (!s.can(action)) throw new HttpError(403, `Your role (${s.role.replace("_", " ")}) cannot ${action}.`);
  return s;
}

export function handle<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A) => {
    try {
      return await fn(...a);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 400;
      return Response.json({ error: (e as Error).message }, { status });
    }
  };
}
