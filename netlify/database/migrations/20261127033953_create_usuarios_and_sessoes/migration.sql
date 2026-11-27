CREATE TABLE "sessoes" (
	"token_hash" text PRIMARY KEY,
	"usuario_id" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"expira_em" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY,
	"usuario" text NOT NULL UNIQUE,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"avatar" text DEFAULT '🎓' NOT NULL,
	"pontos" integer DEFAULT 0 NOT NULL,
	"nivel" integer DEFAULT 1 NOT NULL,
	"progresso" jsonb DEFAULT '{}' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "usuarios_pontos_idx" ON "usuarios" ("pontos");--> statement-breakpoint
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_usuarios_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE;