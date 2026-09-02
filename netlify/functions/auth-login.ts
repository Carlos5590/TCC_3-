import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { usuario, senha } = await req.json();

  if (!usuario || !senha) {
    return Response.json({ erro: "Preencha usuário e senha." }, { status: 400 });
  }

  const [registro] = await db.select().from(users).where(eq(users.username, usuario));

  if (!registro) {
    return Response.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  const senhaValida = await bcrypt.compare(senha, registro.passwordHash);
  if (!senhaValida) {
    return Response.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const token = randomUUID();
  await db.update(users).set({ token }).where(eq(users.id, registro.id));

  return Response.json({
    usuario: registro.username,
    email: registro.email,
    avatar: registro.avatar,
    token,
    progresso: registro.progress,
  });
};

export const config = { path: "/api/login" };
