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

type CompanyValueProfile = {
  company: string;
  values: Array<{
    principle: string;
    question: string;
    competencyTerms: string[];
    storyTerms?: string[];
    roleTerms?: string[];
  }>;
};

const COMPANY_VALUE_PROFILES: CompanyValueProfile[] = [
  {
    company: "google",
    values: [
      {
        principle: "User Focus",
        question: "Tell me about a time you made a product or business decision by putting user needs ahead of an easier internal solution.",
        competencyTerms: ["customer", "product", "leadership"],
        storyTerms: ["user", "customer", "feedback", "adoption", "research"],
      },
      {
        principle: "Googleyness",
        question: "Tell me about a time you helped a team work through ambiguity while staying collaborative and constructive.",
        competencyTerms: ["leadership", "communication", "collaboration"],
        storyTerms: ["ambiguous", "team", "cross-functional", "stakeholder"],
      },
      {
        principle: "Analytical Problem Solving",
        question: "Tell me about a time you used data or structured analysis to make a better decision.",
        competencyTerms: ["problem", "analysis", "data"],
        storyTerms: ["data", "metrics", "analysis", "experiment"],
      },
    ],
  },
  {
    company: "meta",
    values: [
      {
        principle: "Move Fast",
        question: "Tell me about a time you moved quickly to test, learn, or ship something despite uncertainty.",
        competencyTerms: ["execution", "leadership", "problem"],
        storyTerms: ["launch", "experiment", "quickly", "deadline", "ambiguous"],
      },
      {
        principle: "Focus on Long-Term Impact",
        question: "Tell me about a time you prioritized long-term impact over a short-term win.",
        competencyTerms: ["product", "judgment", "leadership"],
        storyTerms: ["strategy", "impact", "tradeoff", "prioritize"],
      },
      {
        principle: "Be Direct and Respect Your Colleagues",
        question: "Tell me about a time you had a difficult conversation with a teammate or stakeholder and kept the relationship productive.",
        competencyTerms: ["communication", "conflict", "leadership"],
        storyTerms: ["stakeholder", "conflict", "alignment", "team"],
      },
    ],
  },
  {
    company: "microsoft",
    values: [
      {
        principle: "Growth Mindset",
        question: "Tell me about a time you had to learn quickly from feedback or failure to improve your approach.",
        competencyTerms: ["learning", "problem", "leadership"],
        storyTerms: ["learn", "feedback", "failure", "improve", "new"],
      },
      {
        principle: "Customer Obsession",
        question: "Tell me about a time you changed your plan because of customer or user insight.",
        competencyTerms: ["customer", "product", "leadership"],
        storyTerms: ["customer", "user", "feedback", "adoption"],
      },
      {
        principle: "One Microsoft",
        question: "Tell me about a time you worked across teams to accomplish something none of you could have done alone.",
        competencyTerms: ["leadership", "collaboration", "communication"],
        storyTerms: ["cross-functional", "team", "stakeholder", "partner"],
      },
    ],
  },
  {
    company: "apple",
    values: [
      {
        principle: "Craft and Simplicity",
        question: "Tell me about a time you simplified a complex experience, process, or product without losing what mattered.",
        competencyTerms: ["product", "problem", "innovation"],
        storyTerms: ["simplify", "design", "workflow", "process", "user"],
      },
      {
        principle: "High Standards",
        question: "Tell me about a time you pushed for a higher-quality outcome even when it was difficult.",
        competencyTerms: ["leadership", "execution", "quality"],
        storyTerms: ["quality", "standard", "launch", "deliver"],
      },
      {
        principle: "Privacy and Trust",
        question: "Tell me about a time you had to balance user trust, business goals, and product impact.",
        competencyTerms: ["judgment", "product", "customer"],
        storyTerms: ["trust", "privacy", "tradeoff", "customer", "user"],
      },
    ],
  },
  {
    company: "netflix",
    values: [
      {
        principle: "Freedom and Responsibility",
        question: "Tell me about a time you were given a lot of autonomy and had to decide how to create impact.",
        competencyTerms: ["ownership", "leadership", "judgment"],
        storyTerms: ["ownership", "autonomy", "ambiguous", "decision"],
      },
      {
        principle: "Context, Not Control",
        question: "Tell me about a time you aligned people by providing context rather than directing every step.",
        competencyTerms: ["leadership", "communication", "collaboration"],
        storyTerms: ["alignment", "stakeholder", "team", "context"],
      },
      {
        principle: "Candid Feedback",
        question: "Tell me about a time you gave or received candid feedback that changed the outcome.",
        competencyTerms: ["communication", "conflict", "learning"],
        storyTerms: ["feedback", "conflict", "improve", "team"],
      },
    ],
  },
  {
    company: "stripe",
    values: [
      {
        principle: "Users First",
        question: "Tell me about a time you deeply understood a user or customer problem and changed your approach because of it.",
        competencyTerms: ["customer", "product", "problem"],
        storyTerms: ["customer", "user", "feedback", "research", "adoption"],
      },
      {
        principle: "Rigor",
        question: "Tell me about a time you used careful reasoning or data to make a hard product or business decision.",
        competencyTerms: ["analysis", "problem", "judgment"],
        storyTerms: ["data", "metrics", "analysis", "tradeoff"],
      },
      {
        principle: "Ambitious Impact",
        question: "Tell me about a time you raised the ambition of a project and brought others along.",
        competencyTerms: ["leadership", "execution", "impact"],
        storyTerms: ["impact", "growth", "team", "stakeholder"],
      },
    ],
  },
  {
    company: "airbnb",
    values: [
      {
        principle: "Champion the Mission",
        question: "Tell me about a time you connected day-to-day work to a broader mission or customer need.",
        competencyTerms: ["leadership", "customer", "product"],
        storyTerms: ["mission", "customer", "user", "impact"],
      },
      {
        principle: "Embrace the Adventure",
        question: "Tell me about a time you navigated uncertainty and still helped the team move forward.",
        competencyTerms: ["leadership", "problem", "adaptability"],
        storyTerms: ["ambiguous", "uncertain", "change", "team"],
      },
      {
        principle: "Be a Host",
        question: "Tell me about a time you anticipated what someone needed before they asked for it.",
        competencyTerms: ["customer", "communication", "leadership"],
        storyTerms: ["customer", "stakeholder", "support", "trust"],
      },
    ],
  },
  {
    company: "uber",
    values: [
      {
        principle: "Go Get It",
        question: "Tell me about a time you took initiative to solve a problem quickly.",
        competencyTerms: ["ownership", "execution", "leadership"],
        storyTerms: ["initiative", "quickly", "urgent", "launch"],
      },
      {
        principle: "Trip Obsessed",
        question: "Tell me about a time you improved an experience by focusing on the end user or customer journey.",
        competencyTerms: ["customer", "product", "problem"],
        storyTerms: ["customer", "user", "experience", "journey", "adoption"],
      },
      {
        principle: "Build with Heart",
        question: "Tell me about a time you balanced speed, impact, and empathy for the people affected by your decision.",
        competencyTerms: ["judgment", "leadership", "communication"],
        storyTerms: ["tradeoff", "team", "customer", "stakeholder"],
      },
    ],
  },
  {
    company: "doordash",
    values: [
      {
        principle: "Bias for Action",
        question: "Tell me about a time you made progress quickly in an ambiguous situation.",
        competencyTerms: ["execution", "leadership", "problem"],
        storyTerms: ["ambiguous", "quickly", "deadline", "launch"],
      },
      {
        principle: "Customer Obsession",
        question: "Tell me about a time you improved an outcome by understanding a customer's pain point.",
        competencyTerms: ["customer", "product", "problem"],
        storyTerms: ["customer", "user", "pain", "feedback", "adoption"],
      },
      {
        principle: "Ownership Mentality",
        question: "Tell me about a time you treated a problem like it was your responsibility even when it was not formally assigned to you.",
        competencyTerms: ["ownership", "leadership"],
        storyTerms: ["ownership", "initiative", "team", "problem"],
      },
    ],
  },
  {
    company: "salesforce",
    values: [
      {
        principle: "Customer Success",
        question: "Tell me about a time you helped a customer or stakeholder succeed in a measurable way.",
        competencyTerms: ["customer", "leadership", "results"],
        storyTerms: ["customer", "stakeholder", "success", "retention", "revenue"],
      },
      {
        principle: "Trust",
        question: "Tell me about a time you built trust with a team, customer, or stakeholder during a difficult situation.",
        competencyTerms: ["communication", "leadership", "conflict"],
        storyTerms: ["trust", "stakeholder", "customer", "conflict"],
      },
      {
        principle: "Innovation",
        question: "Tell me about a time you found a new way to solve a customer or business problem.",
        competencyTerms: ["innovation", "problem", "product"],
        storyTerms: ["new", "build", "create", "workflow", "process"],
      },
    ],
  },
  {
    company: "shopify",
    values: [
      {
        principle: "Merchant Obsession",
        question: "Tell me about a time you made a decision by deeply understanding a user's business need.",
        competencyTerms: ["customer", "product", "problem"],
        storyTerms: ["customer", "merchant", "user", "business", "feedback"],
      },
      {
        principle: "Act Like an Owner",
        question: "Tell me about a time you took ownership of an outcome beyond your formal responsibilities.",
        competencyTerms: ["ownership", "leadership"],
        storyTerms: ["ownership", "initiative", "ambiguous", "team"],
      },
      {
        principle: "Thrive on Change",
        question: "Tell me about a time you adapted quickly when priorities or conditions changed.",
        competencyTerms: ["adaptability", "problem", "leadership"],
        storyTerms: ["change", "adapt", "pivot", "uncertain"],
      },
    ],
  },
  {
    company: "atlassian",
    values: [
      {
        principle: "Open Company, No Bullshit",
        question: "Tell me about a time you communicated transparently about a hard problem.",
        competencyTerms: ["communication", "leadership", "conflict"],
        storyTerms: ["transparent", "stakeholder", "difficult", "alignment"],
      },
      {
        principle: "Build with Heart and Balance",
        question: "Tell me about a time you balanced impact, quality, and team sustainability.",
        competencyTerms: ["judgment", "leadership", "execution"],
        storyTerms: ["quality", "tradeoff", "team", "impact"],
      },
      {
        principle: "Play as a Team",
        question: "Tell me about a time you helped a team collaborate more effectively across functions.",
        competencyTerms: ["collaboration", "leadership", "communication"],
        storyTerms: ["team", "cross-functional", "stakeholder", "collaboration"],
      },
    ],
  },
  {
    company: "adobe",
    values: [
      {
        principle: "Create the Future",
        question: "Tell me about a time you created or improved something that changed how people worked.",
        competencyTerms: ["innovation", "product", "problem"],
        storyTerms: ["create", "build", "workflow", "process", "tool"],
      },
      {
        principle: "Own the Outcome",
        question: "Tell me about a time you stayed accountable for a result through obstacles.",
        competencyTerms: ["ownership", "execution", "leadership"],
        storyTerms: ["ownership", "result", "obstacle", "deliver"],
      },
      {
        principle: "Raise the Bar",
        question: "Tell me about a time you improved quality or performance beyond what was expected.",
        competencyTerms: ["quality", "leadership", "results"],
        storyTerms: ["quality", "improve", "standard", "metric"],
      },
    ],
  },
];

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
  ...COMPANY_VALUE_PROFILES.flatMap(profile =>
    profile.values.map(value => ({
      company: profile.company,
      principle: value.principle,
      question: value.question,
      roleTerms: value.roleTerms,
      competencyTerms: value.competencyTerms,
      storyTerms: value.storyTerms,
    })),
  ),
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
      question: `I do not have a curated ${company} question in the bank yet, so I will use a company-style behavioral question${roleContext}. ${fallbackQuestion} ${answerGuidance}`,
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
