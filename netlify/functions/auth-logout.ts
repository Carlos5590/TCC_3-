import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { usuario, token } = await req.json();

  if (usuario && token) {
    await db
      .update(users)
      .set({ token: null })
      .where(and(eq(users.username, usuario), eq(users.token, token)));
  }

  return Response.json({ ok: true });
};

export const config = { path: "/api/logout" };
