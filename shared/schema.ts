import { pgTable, serial, text, integer, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workspaces = pgTable("workspaces", {
  id: varchar("id", { length: 32 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  workspaceId: varchar("workspace_id", { length: 32 }).references(() => workspaces.id).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  dateRange: text("date_range").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(),
});

export const starAnswers = pgTable("star_answers", {
  id: serial("id").primaryKey(),
  workspaceId: varchar("workspace_id", { length: 32 }).references(() => workspaces.id).notNull(),
  experienceId: integer("experience_id").references(() => experiences.id).notNull(),
  competency: text("competency").notNull(),
  situation: text("situation").notNull(),
  task: text("task").notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(),
  wordCount: integer("word_count"),
  qualityScore: integer("quality_score"),
  qualityNotes: text("quality_notes"),
  companyCustomizations: jsonb("company_customizations"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  workspaceId: varchar("workspace_id", { length: 32 }).references(() => workspaces.id).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  mission: text("mission"),
  values: jsonb("values"),
  cultureKeywords: jsonb("culture_keywords"),
  industry: text("industry"),
  rawTextSummary: text("raw_text_summary"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  workspaceId: varchar("workspace_id", { length: 32 }).references(() => workspaces.id).notNull(),
  status: text("status").notNull().default("created"),
  mode: text("mode").notNull().default("behavioral"),
  targetRole: text("target_role"),
  targetCompanyName: text("target_company_name"),
  companyId: integer("company_id").references(() => companies.id),
  selectedStarAnswerIds: jsonb("selected_star_answer_ids").notNull(),
  elevenLabsConversationId: text("elevenlabs_conversation_id"),
  transcriptSummary: text("transcript_summary"),
  feedback: jsonb("feedback"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const practiceTurns = pgTable("practice_turns", {
  id: serial("id").primaryKey(),
  workspaceId: varchar("workspace_id", { length: 32 }).references(() => workspaces.id).notNull(),
  sessionId: integer("session_id").references(() => practiceSessions.id).notNull(),
  speaker: text("speaker").notNull(),
  text: text("text").notNull(),
  sequence: integer("sequence").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ createdAt: true });
export const insertExperienceSchema = createInsertSchema(experiences).omit({ id: true });
export const insertStarAnswerSchema = createInsertSchema(starAnswers).omit({ id: true, createdAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, scrapedAt: true });
export const insertPracticeSessionSchema = createInsertSchema(practiceSessions).omit({ id: true, createdAt: true });
export const insertPracticeTurnSchema = createInsertSchema(practiceTurns).omit({ id: true, createdAt: true });

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;

export type StarAnswer = typeof starAnswers.$inferSelect;
export type InsertStarAnswer = z.infer<typeof insertStarAnswerSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type PracticeSession = typeof practiceSessions.$inferSelect;
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;

export type PracticeTurn = typeof practiceTurns.$inferSelect;
export type InsertPracticeTurn = z.infer<typeof insertPracticeTurnSchema>;

export type CreateExperienceRequest = InsertExperience;
export type UpdateExperienceRequest = Partial<InsertExperience>;

export type CreateStarAnswerRequest = InsertStarAnswer;
export type UpdateStarAnswerRequest = Partial<InsertStarAnswer>;

export type ParseResumeRequest = { resumeText: string };
export type GenerateStarRequest = { experienceId: number };
export type ScrapeCompanyRequest = { name?: string; url: string };
export type CustomizeAnswerRequest = { starAnswerId: number; companyId: number };
export type CreatePracticeSessionRequest = Omit<InsertPracticeSession, "workspaceId">;
export type UpdatePracticeSessionRequest = Partial<InsertPracticeSession>;
export type CreatePracticeTurnRequest = Omit<InsertPracticeTurn, "workspaceId" | "sessionId" | "sequence"> & { sequence?: number };

export type ExperienceResponse = Experience;
export type StarAnswerResponse = StarAnswer;
export type CompanyResponse = Company;
export type PracticeSessionResponse = PracticeSession;
export type PracticeTurnResponse = PracticeTurn;
