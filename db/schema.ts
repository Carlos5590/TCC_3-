import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial().primaryKey(),
  username: text().notNull().unique(),
  email: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text().default("🎓"),
  token: text(),
  progress: jsonb("progress").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});
