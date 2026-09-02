import { eq, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

const PROGRESSO_PADRAO = {
  nivel: 1,
  pontos: 0,
  badges: [],
  tarefas: [],
  perguntaAtual: 0,
  materias: {},
  materiaSelecionada: null,
  quizDiario: null,
  respostasUsuarioGame: {},
  fasesConcluidas: {},
  diasEstudo: [],
  ultimaFaseGame: null,
  metaDiaria: 1,
  progressoMeta: { data: null, fases: 0 },
  agendaEventos: [],
  tarefasCompletas: 0,
  tarefasSemana: { inicio: null, total: 0 },
};

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { usuario, email, senha, avatar } = await req.json();

  if (!usuario || !email || !senha) {
    return Response.json({ erro: "Preencha todos os campos." }, { status: 400 });
  }

  if (String(senha).length < 4) {
    return Response.json({ erro: "A senha deve ter pelo menos 4 caracteres." }, { status: 400 });
  }

  const existente = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.username, usuario), eq(users.email, email)));

  if (existente.length > 0) {
    return Response.json({ erro: "Este usuário ou email já está cadastrado." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(senha, 10);
  const token = randomUUID();

  const [novo] = await db
    .insert(users)
    .values({
      username: usuario,
      email,
      passwordHash,
      avatar: avatar || "🎓",
      token,
      progress: PROGRESSO_PADRAO,
    })
    .returning();

  return Response.json(
    {
      usuario: novo.username,
      email: novo.email,
      avatar: novo.avatar,
      token: novo.token,
      progresso: novo.progress,
    },
    { status: 201 }
  );
};

export const config = { path: "/api/signup" };
