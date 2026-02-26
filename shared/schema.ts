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

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ createdAt: true });
export const insertExperienceSchema = createInsertSchema(experiences).omit({ id: true });
export const insertStarAnswerSchema = createInsertSchema(starAnswers).omit({ id: true, createdAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, scrapedAt: true });

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;

export type StarAnswer = typeof starAnswers.$inferSelect;
export type InsertStarAnswer = z.infer<typeof insertStarAnswerSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type CreateExperienceRequest = InsertExperience;
export type UpdateExperienceRequest = Partial<InsertExperience>;

export type CreateStarAnswerRequest = InsertStarAnswer;
export type UpdateStarAnswerRequest = Partial<InsertStarAnswer>;

export type ParseResumeRequest = { resumeText: string };
export type GenerateStarRequest = { experienceId: number };
export type ScrapeCompanyRequest = { name?: string; url: string };
export type CustomizeAnswerRequest = { starAnswerId: number; companyId: number };

export type ExperienceResponse = Experience;
export type StarAnswerResponse = StarAnswer;
export type CompanyResponse = Company;
