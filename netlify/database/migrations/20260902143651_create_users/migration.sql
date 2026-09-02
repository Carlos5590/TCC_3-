CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL UNIQUE,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"avatar" text DEFAULT '🎓',
	"token" text,
	"progress" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
