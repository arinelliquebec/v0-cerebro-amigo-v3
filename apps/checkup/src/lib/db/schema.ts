import { pgSchema, bigserial, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const checkupSchema = pgSchema("checkup");

export const funnelEvents = checkupSchema.table("funnel_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: uuid("session_id").notNull(),
  eventType: text("event_type").notNull(),
  scaleId: text("scale_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const testResults = checkupSchema.table("test_results", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: uuid("session_id").notNull().unique(),
  scaleId: text("scale_id").notNull(),
  totalScore: bigserial("total_score", { mode: "number" }).notNull(),
  band: text("band").notNull(),
  crisisFlag: boolean("crisis_flag").notNull().default(false),
  consented: boolean("consented").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// E-mail separado sem FK — LGPD: sem relação direta com respostas
export const reportEmails = checkupSchema.table("report_emails", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: uuid("session_id").notNull(),
  emailHash: text("email_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
