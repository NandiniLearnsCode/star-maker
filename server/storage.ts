import { db } from "./db";
import {
  workspaces,
  experiences,
  starAnswers,
  companies,
  practiceSessions,
  practiceTurns,
  type InsertExperience,
  type InsertStarAnswer,
  type InsertCompany,
  type InsertPracticeSession,
  type InsertPracticeTurn,
  type UpdateExperienceRequest,
  type UpdateStarAnswerRequest,
  type UpdatePracticeSessionRequest,
} from "@shared/schema";
import { eq, desc, and, asc } from "drizzle-orm";

export interface IStorage {
  createWorkspace(id: string): Promise<typeof workspaces.$inferSelect>;
  getWorkspace(id: string): Promise<typeof workspaces.$inferSelect | undefined>;

  getExperiences(workspaceId: string): Promise<(typeof experiences.$inferSelect)[]>;
  getExperience(id: number): Promise<typeof experiences.$inferSelect | undefined>;
  createExperience(exp: InsertExperience): Promise<typeof experiences.$inferSelect>;
  updateExperience(id: number, updates: UpdateExperienceRequest): Promise<typeof experiences.$inferSelect>;
  deleteExperience(id: number): Promise<void>;

  getStarAnswers(workspaceId: string, experienceId?: number): Promise<(typeof starAnswers.$inferSelect)[]>;
  getStarAnswer(id: number): Promise<typeof starAnswers.$inferSelect | undefined>;
  createStarAnswer(answer: InsertStarAnswer): Promise<typeof starAnswers.$inferSelect>;
  updateStarAnswer(id: number, updates: UpdateStarAnswerRequest): Promise<typeof starAnswers.$inferSelect>;
  deleteStarAnswer(id: number): Promise<void>;

  getCompanies(workspaceId: string): Promise<(typeof companies.$inferSelect)[]>;
  getCompany(id: number): Promise<typeof companies.$inferSelect | undefined>;
  createCompany(company: InsertCompany): Promise<typeof companies.$inferSelect>;

  getPracticeSessions(workspaceId: string): Promise<(typeof practiceSessions.$inferSelect)[]>;
  getPracticeSession(id: number): Promise<typeof practiceSessions.$inferSelect | undefined>;
  createPracticeSession(session: InsertPracticeSession): Promise<typeof practiceSessions.$inferSelect>;
  updatePracticeSession(id: number, updates: UpdatePracticeSessionRequest): Promise<typeof practiceSessions.$inferSelect>;

  getPracticeTurns(sessionId: number): Promise<(typeof practiceTurns.$inferSelect)[]>;
  createPracticeTurn(turn: InsertPracticeTurn): Promise<typeof practiceTurns.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  async createWorkspace(id: string) {
    const [created] = await db.insert(workspaces).values({ id }).returning();
    return created;
  }
  async getWorkspace(id: string) {
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return ws;
  }

  async getExperiences(workspaceId: string) {
    return await db.select().from(experiences).where(eq(experiences.workspaceId, workspaceId)).orderBy(desc(experiences.id));
  }
  async getExperience(id: number) {
    const [exp] = await db.select().from(experiences).where(eq(experiences.id, id));
    return exp;
  }
  async createExperience(exp: InsertExperience) {
    const [created] = await db.insert(experiences).values(exp).returning();
    return created;
  }
  async updateExperience(id: number, updates: UpdateExperienceRequest) {
    const [updated] = await db.update(experiences).set(updates).where(eq(experiences.id, id)).returning();
    return updated;
  }
  async deleteExperience(id: number) {
    await db.delete(experiences).where(eq(experiences.id, id));
  }

  async getStarAnswers(workspaceId: string, experienceId?: number) {
    if (experienceId !== undefined) {
      return await db.select().from(starAnswers).where(and(eq(starAnswers.workspaceId, workspaceId), eq(starAnswers.experienceId, experienceId))).orderBy(desc(starAnswers.createdAt));
    }
    return await db.select().from(starAnswers).where(eq(starAnswers.workspaceId, workspaceId)).orderBy(desc(starAnswers.createdAt));
  }
  async getStarAnswer(id: number) {
    const [answer] = await db.select().from(starAnswers).where(eq(starAnswers.id, id));
    return answer;
  }
  async createStarAnswer(answer: InsertStarAnswer) {
    const [created] = await db.insert(starAnswers).values(answer).returning();
    return created;
  }
  async updateStarAnswer(id: number, updates: UpdateStarAnswerRequest) {
    const [updated] = await db.update(starAnswers).set(updates).where(eq(starAnswers.id, id)).returning();
    return updated;
  }
  async deleteStarAnswer(id: number) {
    await db.delete(starAnswers).where(eq(starAnswers.id, id));
  }

  async getCompanies(workspaceId: string) {
    return await db.select().from(companies).where(eq(companies.workspaceId, workspaceId)).orderBy(desc(companies.scrapedAt));
  }
  async getCompany(id: number) {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }
  async createCompany(company: InsertCompany) {
    const [created] = await db.insert(companies).values(company).returning();
    return created;
  }

  async getPracticeSessions(workspaceId: string) {
    return await db.select().from(practiceSessions).where(eq(practiceSessions.workspaceId, workspaceId)).orderBy(desc(practiceSessions.createdAt));
  }
  async getPracticeSession(id: number) {
    const [session] = await db.select().from(practiceSessions).where(eq(practiceSessions.id, id));
    return session;
  }
  async createPracticeSession(session: InsertPracticeSession) {
    const [created] = await db.insert(practiceSessions).values(session).returning();
    return created;
  }
  async updatePracticeSession(id: number, updates: UpdatePracticeSessionRequest) {
    const [updated] = await db.update(practiceSessions).set(updates).where(eq(practiceSessions.id, id)).returning();
    return updated;
  }

  async getPracticeTurns(sessionId: number) {
    return await db.select().from(practiceTurns).where(eq(practiceTurns.sessionId, sessionId)).orderBy(asc(practiceTurns.sequence));
  }
  async createPracticeTurn(turn: InsertPracticeTurn) {
    const [created] = await db.insert(practiceTurns).values(turn).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
