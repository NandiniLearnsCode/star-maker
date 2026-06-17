import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import mammoth from "mammoth";
import crypto from "crypto";
import { getElevenLabsConversationToken } from "./elevenlabs";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

function generateWorkspaceId(): string {
  return crypto.randomBytes(12).toString("base64url");
}

function getWorkspaceId(req: Request): string | null {
  return (req.headers["x-workspace-id"] as string) || null;
}

async function requireWorkspace(req: Request, res: Response, next: NextFunction) {
  const wsId = getWorkspaceId(req);
  if (!wsId) {
    return res.status(400).json({ message: "Missing workspace ID" });
  }
  const ws = await storage.getWorkspace(wsId);
  if (!ws) {
    return res.status(404).json({ message: "Workspace not found" });
  }
  (req as any).workspaceId = wsId;
  next();
}

async function extractExperiencesFromResume(text: string) {
  const prompt = `You are an expert resume parser. Extract the user's work, project, academic, or leadership experiences from the following resume text. 
Return a JSON array of objects with keys: "type" (one of: work, project, academic, leadership, other), "title", "organization", "dateRange", "description". 
Extract all relevant bullet points into the description.

Resume Text:
${text}
`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
    system: "You must return ONLY a raw JSON array of objects. No markdown formatting, no explanations.",
  });

  const responseText = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  try {
    return JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch (e) {
    console.error("Failed to parse JSON from AI", responseText);
    return [];
  }
}

async function generateStarAnswers(experienceDesc: string) {
  const prompt = `You are an expert interview coach. Given the following experience description, generate 2 different STAR format answers targeting different competencies (e.g. Leadership, Problem Solving, Communication).

Rules:
- Situation: 2-3 sentences setting context.
- Task: 1-2 sentences on specific responsibility.
- Action: 3-5 sentences, first-person "I", specific methods/tools used.
- Result: 2-3 sentences, quantified if possible.

For each answer provide: "competency", "situation", "task", "action", "result", "word_count" (total words), "quality_score" (1-5).

Experience:
${experienceDesc}

Return ONLY a JSON array. No markdown formatting.`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  try {
    return JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch (e) {
    console.error("Failed to parse STAR JSON", responseText);
    return [];
  }
}

async function customizeStarAnswerForCompany(starAnswer: any, company: any) {
  const prompt = `You are an expert interview coach. Tailor the following STAR answer to align perfectly with this company's culture, mission, and industry.

Company Name: ${company.name}
Mission: ${company.mission}
Industry: ${company.industry}
Culture/Values Keywords: ${JSON.stringify(company.cultureKeywords)}

Original STAR Answer:
Situation: ${starAnswer.situation}
Task: ${starAnswer.task}
Action: ${starAnswer.action}
Result: ${starAnswer.result}

Reframe the situation to reference industry relevance, adjust the action language to echo the company's stated values, and align results framing to what the company cares about. Keep the facts accurate.

Return ONLY a JSON object with keys: "situation", "task", "action", "result", "rationale" (a 2 sentence explanation of why this works for the company). No markdown formatting.`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  try {
    return JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch (e) {
    console.error("Failed to parse Customization JSON", responseText);
    return null;
  }
}

function selectedStarAnswerIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is number => typeof id === "number");
}

function formatStarAnswerForPrompt(answer: any) {
  return [
    `Competency: ${answer.competency}`,
    `Situation: ${answer.situation}`,
    `Task: ${answer.task}`,
    `Action: ${answer.action}`,
    `Result: ${answer.result}`,
  ].join("\n");
}

function inferAmazonLeadershipPrinciple(competency: string, targetRole?: string | null) {
  const text = `${competency} ${targetRole || ""}`.toLowerCase();
  if (text.includes("product") || text.includes("customer") || text.includes("user")) return "Customer Obsession";
  if (text.includes("lead")) return "Ownership";
  if (text.includes("problem") || text.includes("analysis") || text.includes("data")) return "Dive Deep";
  if (text.includes("invent") || text.includes("innovation") || text.includes("build")) return "Invent and Simplify";
  if (text.includes("conflict") || text.includes("stakeholder") || text.includes("communication")) return "Earn Trust";
  return "Ownership";
}

function compactText(value: unknown, maxWords = 22) {
  if (typeof value !== "string") return "";
  const words = value
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function lowerFirst(value: string) {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function buildStoryLabel(answer: any, competency: string) {
  const organization = answer?._experience?.organization;
  if (organization) return `your ${organization} ${competency.toLowerCase()} story`;
  return `your ${competency.toLowerCase()} story`;
}

function buildSituationLeadIn(answer: any) {
  const situation = compactText(answer?.situation, 18);
  if (!situation) return "";
  return `When ${lowerFirst(situation)}, `;
}

function buildOpeningQuestion(session: any, answers: any[], companyName?: string | null) {
  const firstAnswer = answers[0];
  const competency = firstAnswer?.competency || "behavioral judgment";
  const role = session.targetRole?.trim();
  const roleContext = role ? ` for ${role}` : "";
  const company = companyName?.trim();
  const storyLabel = buildStoryLabel(firstAnswer, competency);
  const situationLeadIn = buildSituationLeadIn(firstAnswer);

  if (company && company.toLowerCase().includes("amazon")) {
    const principle = inferAmazonLeadershipPrinciple(competency, session.targetRole);
    return `Let's start with Amazon's ${principle} leadership principle. In ${storyLabel}, ${situationLeadIn}how did you decide what to do first, and how did your choices demonstrate ${principle}?`;
  }

  if (company) {
    return `Let's start with ${storyLabel} as if this were a ${company} interview${roleContext}. ${situationLeadIn}how did you approach the problem, and what impact did your work have?`;
  }

  return `Let's start with ${storyLabel}. ${situationLeadIn}how did you approach the problem, and what impact did your work have?`;
}

async function getPracticeContext(session: any, workspaceId: string) {
  const ids = selectedStarAnswerIds(session.selectedStarAnswerIds);
  const answers = [];
  for (const id of ids) {
    const answer = await storage.getStarAnswer(id);
    if (answer && answer.workspaceId === workspaceId) {
      const experience = await storage.getExperience(answer.experienceId);
      answers.push({ ...answer, _experience: experience });
    }
  }

  const company = session.companyId ? await storage.getCompany(session.companyId) : undefined;
  const targetCompanyName = company && company.workspaceId === workspaceId
    ? company.name
    : session.targetCompanyName;
  const companyContext = company && company.workspaceId === workspaceId
    ? [
        `Company: ${company.name}`,
        company.industry ? `Industry: ${company.industry}` : null,
        company.mission ? `Mission: ${company.mission}` : null,
        company.cultureKeywords ? `Culture keywords: ${JSON.stringify(company.cultureKeywords)}` : null,
      ].filter(Boolean).join("\n")
    : targetCompanyName
      ? `Target company: ${targetCompanyName}`
      : "No target company selected.";

  const selectedStories = answers.length
    ? answers.map((answer, index) => `Story ${index + 1}\n${formatStarAnswerForPrompt(answer)}`).join("\n\n")
    : "No prepared STAR stories were selected.";
  const openingQuestion = buildOpeningQuestion(session, answers, targetCompanyName);

  return {
    answers,
    company,
    dynamicVariables: {
      candidate_context: "The candidate is practicing behavioral interviews using STAR-format stories generated from their own experiences.",
      selected_star_stories: selectedStories,
      target_company_context: companyContext,
      target_company_name: targetCompanyName || "No target company selected",
      target_role: session.targetRole || "General internship or early-career role",
      practice_mode: session.mode || "behavioral",
      opening_question: openingQuestion,
    },
  };
}

async function generatePracticeFeedback(session: any, turns: any[]) {
  const transcript = turns.map(turn => `${turn.speaker === "agent" ? "Interviewer" : "Candidate"}: ${turn.text}`).join("\n");
  const prompt = `You are an expert behavioral interview coach. Evaluate this mock interview transcript.

Session mode: ${session.mode}
Target role: ${session.targetRole || "General role"}

Transcript:
${transcript}

Return ONLY a JSON object with these keys:
- "summary": 2-3 sentences summarizing the practice session.
- "scores": an object with numeric 1-5 scores for "starStructure", "specificity", "impact", "conciseness", "followUpHandling", and "confidence".
- "strengths": an array of 2-4 concise strengths.
- "improvements": an array of 2-4 specific improvements.
- "nextQuestion": one behavioral interview question the candidate should practice next.
- "recommendedRewrite": a concise example of how the candidate could improve one answer using STAR structure.

Be direct, supportive, and practical.`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  try {
    return JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch (e) {
    console.error("Failed to parse practice feedback JSON", responseText);
    return {
      summary: "Your practice session was recorded, but the feedback could not be parsed automatically.",
      scores: {},
      strengths: [],
      improvements: ["Review the transcript and identify one answer to tighten into a clearer STAR structure."],
      nextQuestion: "Tell me about a time you handled a difficult challenge.",
      recommendedRewrite: "",
    };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Workspace creation
  app.post('/api/workspaces', async (req, res) => {
    const id = generateWorkspaceId();
    const ws = await storage.createWorkspace(id);
    res.status(201).json(ws);
  });

  app.get('/api/workspaces/:id', async (req, res) => {
    const ws = await storage.getWorkspace(req.params.id);
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    res.json(ws);
  });

  app.put(api.workspaces.updatePreferences.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const input = api.workspaces.updatePreferences.input.parse(req.body);
      const updated = await storage.updateWorkspacePreferences(wsId, {
        targetRole: input.targetRole?.trim() || null,
        targetCompanyName: input.targetCompanyName?.trim() || null,
      });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("Workspace preferences update error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Experiences (all workspace-scoped)
  app.get(api.experiences.list.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const experiences = await storage.getExperiences(wsId);
    res.json(experiences);
  });

  app.post(api.experiences.create.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const input = api.experiences.create.input.parse(req.body);
      const experience = await storage.createExperience({ ...input, workspaceId: wsId });
      res.status(201).json(experience);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.experiences.get.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const exp = await storage.getExperience(Number(req.params.id));
    if (!exp || exp.workspaceId !== wsId) return res.status(404).json({ message: "Experience not found" });
    res.json(exp);
  });

  app.put(api.experiences.update.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const exp = await storage.getExperience(Number(req.params.id));
      if (!exp || exp.workspaceId !== wsId) return res.status(404).json({ message: "Experience not found" });
      const input = api.experiences.update.input.parse(req.body);
      const updated = await storage.updateExperience(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.experiences.delete.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const exp = await storage.getExperience(Number(req.params.id));
    if (!exp || exp.workspaceId !== wsId) return res.status(404).json({ message: "Experience not found" });
    await storage.deleteExperience(Number(req.params.id));
    res.status(204).end();
  });

  app.post(api.experiences.parseResume.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const { resumeText } = api.experiences.parseResume.input.parse(req.body);
      const parsed = await extractExperiencesFromResume(resumeText);
      
      const created = [];
      for (const item of parsed) {
        if (item.title && item.organization && item.description) {
          const exp = await storage.createExperience({
            workspaceId: wsId,
            type: item.type || 'other',
            title: item.title,
            organization: item.organization,
            dateRange: item.dateRange || '',
            description: item.description,
            source: 'resume_parsed'
          });
          created.push(exp);
        }
      }
      res.status(200).json(created);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to parse resume" });
    }
  });

  app.post('/api/experiences/upload', requireWorkspace, upload.single('resume'), async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let extractedText = '';
      const mime = req.file.mimetype;
      const name = req.file.originalname.toLowerCase();

      if (mime === 'application/pdf' || name.endsWith('.pdf')) {
        const { writeFileSync, unlinkSync, readFileSync } = await import('fs');
        const { execSync } = await import('child_process');
        const { join } = await import('path');
        const { tmpdir } = await import('os');
        const tmpPdf = join(tmpdir(), `resume_${Date.now()}.pdf`);
        const tmpTxt = tmpPdf.replace('.pdf', '.txt');
        try {
          writeFileSync(tmpPdf, req.file.buffer);
          execSync(`pdftotext -layout "${tmpPdf}" "${tmpTxt}"`);
          extractedText = readFileSync(tmpTxt, 'utf-8');
        } finally {
          try { unlinkSync(tmpPdf); } catch {}
          try { unlinkSync(tmpTxt); } catch {}
        }
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        name.endsWith('.docx')
      ) {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        extractedText = result.value;
      } else {
        return res.status(400).json({ message: "Unsupported file type. Please upload a PDF or DOCX file." });
      }

      if (!extractedText.trim()) {
        return res.status(400).json({ message: "Could not extract text from the uploaded file." });
      }

      const parsed = await extractExperiencesFromResume(extractedText);

      const created = [];
      for (const item of parsed) {
        if (item.title && item.organization && item.description) {
          const exp = await storage.createExperience({
            workspaceId: wsId,
            type: item.type || 'other',
            title: item.title,
            organization: item.organization,
            dateRange: item.dateRange || '',
            description: item.description,
            source: 'resume_parsed'
          });
          created.push(exp);
        }
      }
      res.status(200).json(created);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Failed to process uploaded resume" });
    }
  });

  // STAR Answers (workspace-scoped)
  app.get(api.starAnswers.list.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const experienceId = req.query.experienceId ? Number(req.query.experienceId) : undefined;
    const answers = await storage.getStarAnswers(wsId, experienceId);
    res.json(answers);
  });

  app.get(api.starAnswers.get.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const answer = await storage.getStarAnswer(Number(req.params.id));
    if (!answer || answer.workspaceId !== wsId) return res.status(404).json({ message: "Answer not found" });
    res.json(answer);
  });

  app.put(api.starAnswers.update.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const answer = await storage.getStarAnswer(Number(req.params.id));
      if (!answer || answer.workspaceId !== wsId) return res.status(404).json({ message: "Answer not found" });
      const input = api.starAnswers.update.input.parse(req.body);
      const updated = await storage.updateStarAnswer(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.starAnswers.delete.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const answer = await storage.getStarAnswer(Number(req.params.id));
    if (!answer || answer.workspaceId !== wsId) return res.status(404).json({ message: "Answer not found" });
    await storage.deleteStarAnswer(Number(req.params.id));
    res.status(204).end();
  });

  app.post(api.starAnswers.generate.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const { experienceId } = api.starAnswers.generate.input.parse(req.body);
      const exp = await storage.getExperience(experienceId);
      if (!exp || exp.workspaceId !== wsId) return res.status(404).json({ message: "Experience not found" });

      const answers = await generateStarAnswers(exp.description);
      const createdAnswers = [];
      
      for (const ans of answers) {
        if (ans.situation && ans.task && ans.action && ans.result) {
          const created = await storage.createStarAnswer({
            workspaceId: wsId,
            experienceId: exp.id,
            competency: ans.competency || 'General',
            situation: ans.situation,
            task: ans.task,
            action: ans.action,
            result: ans.result,
            wordCount: ans.word_count || 100,
            qualityScore: ans.quality_score || 4,
            qualityNotes: ans.quality_notes || null,
            companyCustomizations: []
          });
          createdAnswers.push(created);
        }
      }
      res.status(201).json(createdAnswers);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to generate answers" });
    }
  });

  app.post(api.starAnswers.customize.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const { companyId } = api.starAnswers.customize.input.parse(req.body);
      const answer = await storage.getStarAnswer(Number(req.params.id));
      if (!answer || answer.workspaceId !== wsId) return res.status(404).json({ message: "Answer not found" });
      
      const company = await storage.getCompany(companyId);
      if (!company || company.workspaceId !== wsId) return res.status(404).json({ message: "Company not found" });

      const customized = await customizeStarAnswerForCompany(answer, company);
      if (!customized) return res.status(500).json({ message: "Failed to customize" });

      const customizations = answer.companyCustomizations as any[] || [];
      customizations.push({
        companyId: company.id,
        companyName: company.name,
        date: new Date().toISOString(),
        customizedData: customized
      });

      const updated = await storage.updateStarAnswer(answer.id, { companyCustomizations: customizations });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Companies (workspace-scoped)
  app.get(api.companies.list.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const companiesList = await storage.getCompanies(wsId);
    res.json(companiesList);
  });

  app.post(api.companies.scrape.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const { url, name } = api.companies.scrape.input.parse(req.body);
      
      const derivedName = name || new URL(url).hostname.replace('www.', '').split('.')[0];
      const companyName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

      const prompt = `You are a company research expert. Based on the company name "${companyName}" and their website URL "${url}", provide a detailed company profile using your training knowledge.

Return ONLY a JSON object with these keys:
- "name": The official company name
- "mission": Their mission statement or a concise summary of their purpose (1-2 sentences)
- "industry": Their primary industry
- "values": An array of 3-6 core company values (strings)
- "cultureKeywords": An array of 5-8 keywords describing their work culture (strings)
- "summary": A 2-3 sentence summary of what the company does and what they look for in employees

No markdown formatting, just the JSON object.`;

      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = msg.content[0].type === "text" ? msg.content[0].text : "{}";
      let companyData: any;
      try {
        companyData = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
      } catch {
        companyData = {};
      }

      const company = await storage.createCompany({
        workspaceId: wsId,
        name: companyData.name || companyName,
        url: url,
        mission: companyData.mission || `${companyName}'s mission`,
        industry: companyData.industry || "Technology",
        values: companyData.values || ["Innovation"],
        cultureKeywords: companyData.cultureKeywords || ["collaborative"],
        rawTextSummary: companyData.summary || `Profile for ${companyName}`
      });
      
      res.json(company);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Company scrape error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Voice practice sessions (workspace-scoped)
  app.get(api.practiceSessions.list.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const sessions = await storage.getPracticeSessions(wsId);
    res.json(sessions);
  });

  app.post(api.practiceSessions.create.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const input = api.practiceSessions.create.input.parse(req.body);

      for (const answerId of input.selectedStarAnswerIds) {
        const answer = await storage.getStarAnswer(answerId);
        if (!answer || answer.workspaceId !== wsId) {
          return res.status(404).json({ message: "Selected STAR answer not found" });
        }
      }

      if (input.companyId) {
        const company = await storage.getCompany(input.companyId);
        if (!company || company.workspaceId !== wsId) {
          return res.status(404).json({ message: "Company not found" });
        }
      }

      const session = await storage.createPracticeSession({
        workspaceId: wsId,
        status: "created",
        mode: input.mode,
        targetRole: input.targetRole || null,
        targetCompanyName: input.targetCompanyName || null,
        companyId: input.companyId || null,
        selectedStarAnswerIds: input.selectedStarAnswerIds,
        elevenLabsConversationId: null,
        transcriptSummary: null,
        feedback: null,
        startedAt: null,
        endedAt: null,
      });

      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("Practice session create error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.practiceSessions.get.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const session = await storage.getPracticeSession(Number(req.params.id));
    if (!session || session.workspaceId !== wsId) return res.status(404).json({ message: "Practice session not found" });

    const turns = await storage.getPracticeTurns(session.id);
    res.json({ session, turns });
  });

  app.post(api.practiceSessions.conversationToken.path, requireWorkspace, async (req, res) => {
    const wsId = (req as any).workspaceId;
    const session = await storage.getPracticeSession(Number(req.params.id));
    if (!session || session.workspaceId !== wsId) return res.status(404).json({ message: "Practice session not found" });

    try {
      const { dynamicVariables } = await getPracticeContext(session, wsId);
      const token = await getElevenLabsConversationToken();
      const updated = await storage.updatePracticeSession(session.id, {
        status: "active",
        startedAt: session.startedAt || new Date(),
      });

      res.json({
        token,
        practiceSessionId: updated.id,
        dynamicVariables,
      });
    } catch (err) {
      console.error("ElevenLabs token error:", err);
      res.status(500).json({ message: err instanceof Error ? err.message : "Failed to start voice practice" });
    }
  });

  app.post(api.practiceSessions.addTurn.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const session = await storage.getPracticeSession(Number(req.params.id));
      if (!session || session.workspaceId !== wsId) return res.status(404).json({ message: "Practice session not found" });

      const input = api.practiceSessions.addTurn.input.parse(req.body);
      const existingTurns = await storage.getPracticeTurns(session.id);
      const sequence = input.sequence ?? existingTurns.length;
      const turn = await storage.createPracticeTurn({
        workspaceId: wsId,
        sessionId: session.id,
        speaker: input.speaker,
        text: input.text,
        sequence,
        metadata: input.metadata || null,
      });

      res.status(201).json(turn);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("Practice turn create error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.practiceSessions.complete.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const session = await storage.getPracticeSession(Number(req.params.id));
      if (!session || session.workspaceId !== wsId) return res.status(404).json({ message: "Practice session not found" });

      const input = api.practiceSessions.complete.input.parse(req.body);
      const updated = await storage.updatePracticeSession(session.id, {
        status: "completed",
        endedAt: new Date(),
        elevenLabsConversationId: input?.elevenLabsConversationId || session.elevenLabsConversationId,
      });

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Practice session complete error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.practiceSessions.feedback.path, requireWorkspace, async (req, res) => {
    try {
      const wsId = (req as any).workspaceId;
      const session = await storage.getPracticeSession(Number(req.params.id));
      if (!session || session.workspaceId !== wsId) return res.status(404).json({ message: "Practice session not found" });

      const turns = await storage.getPracticeTurns(session.id);
      if (turns.length === 0) {
        return res.status(400).json({ message: "No transcript turns found for this practice session" });
      }

      const feedback = await generatePracticeFeedback(session, turns);
      const updated = await storage.updatePracticeSession(session.id, {
        feedback,
        transcriptSummary: feedback.summary || null,
        status: "completed",
        endedAt: session.endedAt || new Date(),
      });

      res.json(updated);
    } catch (err) {
      console.error("Practice feedback error:", err);
      res.status(500).json({ message: "Failed to generate practice feedback" });
    }
  });

  return httpServer;
}
