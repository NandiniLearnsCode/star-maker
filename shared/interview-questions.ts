export type PracticeQuestionMode = "behavioral" | "company" | "story_focus" | string;

export type PracticeStoryContext = {
  competency?: string | null;
  situation?: string | null;
  task?: string | null;
  action?: string | null;
  result?: string | null;
  organization?: string | null;
};

export type OpeningQuestionInput = {
  mode?: PracticeQuestionMode | null;
  companyName?: string | null;
  targetRole?: string | null;
  story?: PracticeStoryContext | null;
};

export type OpeningQuestionResult = {
  question: string;
  source: "company_bank" | "company_fallback" | "general_fallback" | "story_deep_dive";
  sourceLabel: string;
  principle?: string;
  competency: string;
};

type BankQuestion = {
  company: string;
  question: string;
  principle?: string;
  roleTerms?: string[];
  competencyTerms: string[];
  storyTerms?: string[];
};

const COMPANY_QUESTION_BANK: BankQuestion[] = [
  {
    company: "amazon",
    principle: "Customer Obsession",
    roleTerms: ["product", "pm", "manager"],
    competencyTerms: ["customer", "product", "leadership"],
    storyTerms: ["customer", "user", "adoption", "retention", "churn", "feedback"],
    question: "Tell me about a time you used customer feedback, customer behavior, or product data to change a decision.",
  },
  {
    company: "amazon",
    principle: "Ownership",
    competencyTerms: ["leadership", "ownership"],
    storyTerms: ["ownership", "ambiguous", "retention", "churn", "team", "initiative"],
    question: "Tell me about a time you took ownership of an ambiguous problem that did not have a clear owner.",
  },
  {
    company: "amazon",
    principle: "Dive Deep",
    roleTerms: ["product", "pm", "analytics", "data"],
    competencyTerms: ["problem", "analysis", "data", "leadership"],
    storyTerms: ["data", "metrics", "analysis", "root cause", "signals", "adoption", "retention"],
    question: "Tell me about a time you used data to uncover the root cause of a business or product problem.",
  },
  {
    company: "amazon",
    principle: "Invent and Simplify",
    roleTerms: ["product", "pm", "manager"],
    competencyTerms: ["innovation", "problem", "product"],
    storyTerms: ["build", "create", "simplify", "workflow", "tool", "process"],
    question: "Tell me about a time you invented or simplified a process, product, or workflow for your team or customers.",
  },
  {
    company: "amazon",
    principle: "Earn Trust",
    competencyTerms: ["leadership", "communication", "conflict"],
    storyTerms: ["cross-functional", "stakeholder", "customer success", "sales", "analytics", "team"],
    question: "Tell me about a time you led a difficult cross-functional collaboration and had to earn trust across teams.",
  },
  {
    company: "amazon",
    principle: "Have Backbone; Disagree and Commit",
    competencyTerms: ["conflict", "communication", "leadership"],
    storyTerms: ["disagree", "stakeholder", "tradeoff", "alignment", "pushback"],
    question: "Tell me about a time you disagreed with stakeholders, made your case, and still committed to the final decision.",
  },
  {
    company: "amazon",
    principle: "Bias for Action",
    competencyTerms: ["leadership", "problem", "execution"],
    storyTerms: ["urgent", "quickly", "ambiguous", "limited", "deadline", "launch"],
    question: "Tell me about a time you had to make a high-quality decision quickly with incomplete information.",
  },
  {
    company: "amazon",
    principle: "Deliver Results",
    competencyTerms: ["leadership", "execution", "results"],
    storyTerms: ["revenue", "retention", "growth", "goal", "metric", "result"],
    question: "Tell me about a time you were responsible for delivering a measurable result despite meaningful obstacles.",
  },
  {
    company: "amazon",
    principle: "Learn and Be Curious",
    competencyTerms: ["learning", "problem", "product"],
    storyTerms: ["learn", "new", "research", "experiment", "discovery"],
    question: "Tell me about a time you had to learn something new quickly to solve a customer or business problem.",
  },
  {
    company: "amazon",
    principle: "Are Right, A Lot",
    roleTerms: ["product", "pm", "manager"],
    competencyTerms: ["judgment", "problem", "product"],
    storyTerms: ["tradeoff", "prioritize", "decision", "strategy", "roadmap"],
    question: "Tell me about a time you made a difficult product or business tradeoff and how you knew it was the right decision.",
  },
];

function normalize(value: unknown) {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

function includesAny(text: string, terms: string[] = []) {
  return terms.some(term => text.includes(term.toLowerCase()));
}

function compactText(value: unknown, maxWords = 18) {
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

function storySearchText(story?: PracticeStoryContext | null) {
  return normalize([
    story?.competency,
    story?.situation,
    story?.task,
    story?.action,
    story?.result,
    story?.organization,
  ].filter(Boolean).join(" "));
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

function buildStoryLabel(story: PracticeStoryContext | null | undefined, competency: string) {
  const organization = story?.organization?.trim();
  if (organization) return `your ${organization} ${competency.toLowerCase()} story`;
  return `your ${competency.toLowerCase()} story`;
}

function buildSituationLeadIn(story: PracticeStoryContext | null | undefined) {
  const situation = compactText(story?.situation, 18);
  if (!situation) return "";
  return `When ${lowerFirst(situation)}, `;
}

function buildGeneralCompetencyQuestion(competency: string, story?: PracticeStoryContext | null) {
  const text = storySearchText(story);
  const lowerCompetency = competency.toLowerCase();

  if (lowerCompetency.includes("lead")) {
    if (includesAny(text, ["cross-functional", "stakeholder", "customer success", "analytics", "sales", "team"])) {
      return "Tell me about a time you led a difficult cross-functional collaboration.";
    }
    return "Tell me about a time you had to lead others through an ambiguous or challenging situation.";
  }

  if (lowerCompetency.includes("problem")) {
    return "Tell me about a time you solved an ambiguous problem when the right answer was not obvious.";
  }

  if (lowerCompetency.includes("communication")) {
    return "Tell me about a time you had to communicate a complex or difficult message to stakeholders.";
  }

  if (lowerCompetency.includes("ownership")) {
    return "Tell me about a time you took ownership of a problem that did not have a clear owner.";
  }

  if (lowerCompetency.includes("conflict")) {
    return "Tell me about a time you handled disagreement or conflict while still moving the work forward.";
  }

  if (lowerCompetency.includes("customer")) {
    return "Tell me about a time you used customer insight to change your approach or decision.";
  }

  return `Tell me about a time you demonstrated ${competency.toLowerCase()} in a challenging situation.`;
}

function findCompanyQuestion(input: OpeningQuestionInput, competency: string) {
  const company = normalize(input.companyName);
  if (!company) return null;

  const role = normalize(input.targetRole);
  const storyText = storySearchText(input.story);
  const lowerCompetency = competency.toLowerCase();

  const scored = COMPANY_QUESTION_BANK
    .filter(item => company.includes(item.company))
    .map(item => {
      let score = 10;
      if (includesAny(role, item.roleTerms)) score += 4;
      if (includesAny(lowerCompetency, item.competencyTerms)) score += 5;
      if (includesAny(storyText, item.storyTerms)) score += 3;
      if (item.principle && storyText.includes(item.principle.toLowerCase())) score += 2;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.item || null;
}

export function buildOpeningQuestion(input: OpeningQuestionInput): OpeningQuestionResult {
  const story = input.story;
  const competency = story?.competency?.trim() || "behavioral judgment";
  const company = input.companyName?.trim();
  const role = input.targetRole?.trim();
  const roleContext = role ? ` for ${role}` : "";
  const storyLabel = buildStoryLabel(story, competency);
  const situationLeadIn = buildSituationLeadIn(story);
  const answerGuidance = story
    ? "Use the example you selected when you answer."
    : "Use the strongest example from your experience when you answer.";

  if (input.mode === "story_focus") {
    if (company && company.toLowerCase().includes("amazon")) {
      const principle = inferAmazonLeadershipPrinciple(competency, input.targetRole);
      return {
        question: `Let's do a story deep dive through Amazon's ${principle} lens. In ${storyLabel}, ${situationLeadIn}how did you decide what to do first, and how did your choices demonstrate ${principle}?`,
        source: "story_deep_dive",
        sourceLabel: "Story deep dive",
        principle,
        competency,
      };
    }

    return {
      question: company
        ? `Let's do a story deep dive as if this were a ${company} interview${roleContext}. In ${storyLabel}, ${situationLeadIn}how did you approach the problem, and what impact did your work have?`
        : `Let's do a story deep dive on ${storyLabel}. ${situationLeadIn}how did you approach the problem, and what impact did your work have?`,
      source: "story_deep_dive",
      sourceLabel: "Story deep dive",
      competency,
    };
  }

  const bankQuestion = findCompanyQuestion(input, competency);
  if (bankQuestion && company) {
    return {
      question: `Let's start with a ${company} interview question${roleContext}${bankQuestion.principle ? ` tied to ${bankQuestion.principle}` : ""}. ${bankQuestion.question} ${answerGuidance}`,
      source: "company_bank",
      sourceLabel: `${company} question bank`,
      principle: bankQuestion.principle,
      competency,
    };
  }

  const fallbackQuestion = buildGeneralCompetencyQuestion(competency, story);
  if (company) {
    return {
      question: `Let's start with a ${company} behavioral question${roleContext}. ${fallbackQuestion} ${answerGuidance}`,
      source: "company_fallback",
      sourceLabel: `${company} fallback question`,
      competency,
    };
  }

  return {
    question: `Let's start with a competency-based behavioral question. ${fallbackQuestion} ${answerGuidance}`,
    source: "general_fallback",
    sourceLabel: "General competency fallback",
    competency,
  };
}
