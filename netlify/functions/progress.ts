import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "PUT") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { usuario, token, progresso } = await req.json();

  if (!usuario || !token || !progresso) {
    return Response.json({ erro: "Dados incompletos." }, { status: 400 });
  }

  const resultado = await db
    .update(users)
    .set({ progress: progresso })
    .where(and(eq(users.username, usuario), eq(users.token, token)))
    .returning({ id: users.id });

  if (resultado.length === 0) {
    return Response.json({ erro: "Sessão inválida." }, { status: 401 });
  }

  return Response.json({ ok: true });
};

export const config = { path: "/api/progress" };
