import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import mammoth from "mammoth";
import crypto from "crypto";

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

  return httpServer;
}
