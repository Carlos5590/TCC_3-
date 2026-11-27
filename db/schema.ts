import { pgTable, serial, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";

// Contas dos estudantes. Pontos, nível e avatar ficam em colunas próprias
// para o ranking; o restante do progresso (matérias, agenda, tarefas, jogo,
// quiz diário, conquistas...) fica no campo JSON "progresso".
export const usuarios = pgTable(
  "usuarios",
  {
    id: serial().primaryKey(),
    usuario: text().notNull().unique(),
    email: text().notNull(),
    senhaHash: text("senha_hash").notNull(),
    avatar: text().notNull().default("🎓"),
    pontos: integer().notNull().default(0),
    nivel: integer().notNull().default(1),
    progresso: jsonb().notNull().default({}),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em").notNull().defaultNow(),
  },
  (t) => [index("usuarios_pontos_idx").on(t.pontos)],
);

// Sessões de login. Guardamos apenas o hash SHA-256 do token.
export const sessoes = pgTable("sessoes", {
  tokenHash: text("token_hash").primaryKey(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
  expiraEm: timestamp("expira_em").notNull(),
});
