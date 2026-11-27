import type { Config } from "@netlify/server";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { db } from "../../db/index.js";
import { sessoes, usuarios } from "../../db/schema.js";

const scryptAsync = promisify(scrypt) as (senha: string, salt: Buffer, tamanho: number) => Promise<Buffer>;

const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const TAMANHO_MAX_PROGRESSO = 1_000_000; // ~1 MB de JSON por usuário
const AVATARES = ["🎓", "🧠", "🚀", "🌟", "🎯", "📚", "🔬", "🌍", "🎨", "⚡"];

// ---------- utilitários ----------

function erro(mensagem: string, status: number) {
  return Response.json({ erro: mensagem }, { status });
}

async function lerJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const corpo = await req.json();
    return corpo && typeof corpo === "object" && !Array.isArray(corpo) ? corpo : null;
  } catch {
    return null;
  }
}

async function gerarHashSenha(senha: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(senha, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function conferirSenha(senha: string, armazenado: string) {
  const [, saltHex, hashHex] = armazenado.split("$");
  if (!saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await scryptAsync(senha, Buffer.from(saltHex, "hex"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function criarSessao(usuarioId: number) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessoes).values({
    tokenHash: hashToken(token),
    usuarioId,
    expiraEm: new Date(Date.now() + DURACAO_SESSAO_MS),
  });
  // Limpa sessões vencidas de vez em quando.
  await db.delete(sessoes).where(lt(sessoes.expiraEm, new Date()));
  return token;
}

function tokenDaRequisicao(req: Request) {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

async function usuarioAutenticado(req: Request) {
  const token = tokenDaRequisicao(req);
  if (!token) return null;
  const [linha] = await db
    .select({ usuario: usuarios })
    .from(sessoes)
    .innerJoin(usuarios, eq(sessoes.usuarioId, usuarios.id))
    .where(and(eq(sessoes.tokenHash, hashToken(token)), gt(sessoes.expiraEm, new Date())))
    .limit(1);
  return linha?.usuario ?? null;
}

function numeroInteiro(valor: unknown, minimo: number, padrao: number) {
  const n = Math.floor(Number(valor));
  return Number.isFinite(n) && n >= minimo ? n : padrao;
}

// Remove campos que nunca devem ir para o JSON de progresso.
function limparProgresso(dados: unknown): Record<string, unknown> | null {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) return null;
  const { senha, email, avatar, ...resto } = dados as Record<string, unknown>;
  void senha; void email; void avatar;
  if (JSON.stringify(resto).length > TAMANHO_MAX_PROGRESSO) return null;
  return resto;
}

// Formato que o front-end usa em memória para cada usuário.
function dadosParaCliente(u: typeof usuarios.$inferSelect) {
  return {
    ...(u.progresso as Record<string, unknown>),
    email: u.email,
    avatar: u.avatar,
    pontos: u.pontos,
    nivel: u.nivel,
  };
}

// ---------- rotas ----------

async function cadastrar(req: Request) {
  const corpo = await lerJson(req);
  if (!corpo) return erro("Dados inválidos.", 400);

  const usuario = String(corpo.usuario ?? "").trim();
  const email = String(corpo.email ?? "").trim();
  const senha = String(corpo.senha ?? "");
  const avatar = AVATARES.includes(String(corpo.avatar)) ? String(corpo.avatar) : "🎓";

  if (!usuario || !email || !senha) return erro("Preencha todos os campos!", 400);
  if (usuario.length > 40) return erro("O nome de usuário deve ter no máximo 40 caracteres.", 400);
  if (senha.length < 4) return erro("A senha deve ter pelo menos 4 caracteres!", 400);

  // Progresso opcional: permite migrar uma conta que existia só no navegador.
  const progresso = corpo.progresso ? limparProgresso(corpo.progresso) : {};
  if (progresso === null) return erro("Progresso inválido.", 400);

  const [existente] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.usuario, usuario)).limit(1);
  if (existente) return erro("Este usuário já existe!", 409);

  const [novo] = await db
    .insert(usuarios)
    .values({
      usuario,
      email,
      senhaHash: await gerarHashSenha(senha),
      avatar,
      pontos: numeroInteiro(progresso.pontos, 0, 0),
      nivel: numeroInteiro(progresso.nivel, 1, 1),
      progresso,
    })
    .onConflictDoNothing({ target: usuarios.usuario })
    .returning();
  if (!novo) return erro("Este usuário já existe!", 409);

  return Response.json({ ok: true }, { status: 201 });
}

async function entrar(req: Request) {
  const corpo = await lerJson(req);
  if (!corpo) return erro("Dados inválidos.", 400);
  const usuario = String(corpo.usuario ?? "").trim();
  const senha = String(corpo.senha ?? "");
  if (!usuario || !senha) return erro("Preencha usuário e senha!", 400);

  const [u] = await db.select().from(usuarios).where(eq(usuarios.usuario, usuario)).limit(1);
  if (!u) return erro("Usuário não encontrado!", 404);
  if (!(await conferirSenha(senha, u.senhaHash))) return erro("Senha incorreta!", 401);

  const token = await criarSessao(u.id);
  return Response.json({ token, usuario: u.usuario, dados: dadosParaCliente(u) });
}

async function sair(req: Request) {
  const token = tokenDaRequisicao(req);
  if (token) await db.delete(sessoes).where(eq(sessoes.tokenHash, hashToken(token)));
  return Response.json({ ok: true });
}

async function meusDados(req: Request) {
  const u = await usuarioAutenticado(req);
  if (!u) return erro("Sessão expirada. Faça login novamente.", 401);
  return Response.json({ usuario: u.usuario, dados: dadosParaCliente(u) });
}

async function salvarProgresso(req: Request) {
  const u = await usuarioAutenticado(req);
  if (!u) return erro("Sessão expirada. Faça login novamente.", 401);

  const corpo = await lerJson(req);
  const progresso = limparProgresso(corpo?.dados);
  if (!progresso) return erro("Progresso inválido.", 400);

  await db
    .update(usuarios)
    .set({
      pontos: numeroInteiro(progresso.pontos, 0, u.pontos),
      nivel: numeroInteiro(progresso.nivel, 1, u.nivel),
      progresso,
      atualizadoEm: new Date(),
    })
    .where(eq(usuarios.id, u.id));

  return Response.json({ ok: true });
}

async function ranking() {
  const lista = await db
    .select({ nome: usuarios.usuario, pontos: usuarios.pontos, nivel: usuarios.nivel, avatar: usuarios.avatar })
    .from(usuarios)
    .orderBy(desc(usuarios.pontos), usuarios.criadoEm)
    .limit(100);
  return Response.json(lista);
}

export default async (req: Request) => {
  const { pathname } = new URL(req.url);
  const rota = `${req.method} ${pathname.replace(/\/+$/, "")}`;

  try {
    switch (rota) {
      case "POST /api/cadastro":
        return await cadastrar(req);
      case "POST /api/login":
        return await entrar(req);
      case "POST /api/logout":
        return await sair(req);
      case "GET /api/me":
        return await meusDados(req);
      case "PUT /api/progresso":
        return await salvarProgresso(req);
      case "GET /api/ranking":
        return await ranking();
      default:
        return erro("Rota não encontrada.", 404);
    }
  } catch (e) {
    console.error("Erro na API:", e);
    return erro("Erro interno no servidor. Tente novamente.", 500);
  }
};

export const config: Config = {
  path: "/api/*",
};
