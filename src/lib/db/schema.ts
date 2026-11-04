/**
 * Drizzle schema — Vercel Postgres
 * نخزّن المستخدمين، المشاريع، الجلسات، والمفاتيح المشفّرة
 */
import { pgTable, text, timestamp, boolean, jsonb, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  githubId: varchar("github_id", { length: 64 }),
  githubTokenEnc: text("github_token_enc"),
  openRouterKeyEnc: text("openrouter_key_enc"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  githubUrl: text("github_url"),
  lastSnapshotId: text("last_snapshot_id"),
  lastSandboxId: text("last_sandbox_id"),
  config: jsonb("config").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  sandboxId: text("sandbox_id").notNull(),
  domain: text("domain"),
  status: varchar("status", { length: 32 }).default("running"),
  model: varchar("model", { length: 128 }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const sandboxSnapshots = pgTable("sandbox_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  sandboxId: text("sandbox_id").notNull(),
  snapshotId: text("snapshot_id").notNull(),
  blobUrl: text("blob_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});
