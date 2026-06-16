import { z } from 'zod';
import {
  insertExperienceSchema,
  insertStarAnswerSchema,
  insertCompanySchema,
  workspaces,
  experiences,
  starAnswers,
  companies,
  practiceSessions,
  practiceTurns,
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  workspaces: {
    updatePreferences: {
      method: 'PUT' as const,
      path: '/api/workspaces/preferences' as const,
      input: z.object({
        targetRole: z.string().trim().optional(),
        targetCompanyName: z.string().trim().optional(),
      }),
      responses: {
        200: z.custom<typeof workspaces.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  experiences: {
    list: {
      method: 'GET' as const,
      path: '/api/experiences' as const,
      responses: {
        200: z.array(z.custom<typeof experiences.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/experiences/:id' as const,
      responses: {
        200: z.custom<typeof experiences.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/experiences' as const,
      input: insertExperienceSchema.omit({ workspaceId: true }),
      responses: {
        201: z.custom<typeof experiences.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/experiences/:id' as const,
      input: insertExperienceSchema.omit({ workspaceId: true }).partial(),
      responses: {
        200: z.custom<typeof experiences.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/experiences/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    parseResume: {
      method: 'POST' as const,
      path: '/api/experiences/parse' as const,
      input: z.object({ resumeText: z.string() }),
      responses: {
        200: z.array(insertExperienceSchema),
        400: errorSchemas.validation,
      }
    }
  },
  starAnswers: {
    list: {
      method: 'GET' as const,
      path: '/api/star-answers' as const,
      input: z.object({ experienceId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof starAnswers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/star-answers/:id' as const,
      responses: {
        200: z.custom<typeof starAnswers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/star-answers/:id' as const,
      input: insertStarAnswerSchema.omit({ workspaceId: true }).partial(),
      responses: {
        200: z.custom<typeof starAnswers.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/star-answers/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/star-answers/generate' as const,
      input: z.object({ experienceId: z.number() }),
      responses: {
        201: z.array(z.custom<typeof starAnswers.$inferSelect>()),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      }
    },
    customize: {
      method: 'POST' as const,
      path: '/api/star-answers/:id/customize' as const,
      input: z.object({ companyId: z.number() }),
      responses: {
        200: z.custom<typeof starAnswers.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      }
    }
  },
  companies: {
    scrape: {
      method: 'POST' as const,
      path: '/api/companies/scrape' as const,
      input: z.object({ url: z.string().url(), name: z.string().optional() }),
      responses: {
        200: z.custom<typeof companies.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/companies' as const,
      responses: {
        200: z.array(z.custom<typeof companies.$inferSelect>()),
      }
    }
  },
  practiceSessions: {
    list: {
      method: 'GET' as const,
      path: '/api/practice-sessions' as const,
      responses: {
        200: z.array(z.custom<typeof practiceSessions.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/practice-sessions/:id' as const,
      responses: {
        200: z.object({
          session: z.custom<typeof practiceSessions.$inferSelect>(),
          turns: z.array(z.custom<typeof practiceTurns.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/practice-sessions' as const,
      input: z.object({
        selectedStarAnswerIds: z.array(z.number()).min(1, "Choose at least one STAR story to practice"),
        mode: z.enum(['behavioral', 'company', 'story_focus']).default('behavioral'),
        targetRole: z.string().trim().optional(),
        targetCompanyName: z.string().trim().optional(),
        companyId: z.number().optional(),
      }),
      responses: {
        201: z.custom<typeof practiceSessions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    conversationToken: {
      method: 'POST' as const,
      path: '/api/practice-sessions/:id/conversation-token' as const,
      responses: {
        200: z.object({
          token: z.string(),
          practiceSessionId: z.number(),
          dynamicVariables: z.record(z.string()),
        }),
        404: errorSchemas.notFound,
      },
    },
    addTurn: {
      method: 'POST' as const,
      path: '/api/practice-sessions/:id/turns' as const,
      input: z.object({
        speaker: z.enum(['user', 'agent']),
        text: z.string().trim().min(1),
        sequence: z.number().int().nonnegative().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
      responses: {
        201: z.custom<typeof practiceTurns.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/practice-sessions/:id/complete' as const,
      input: z.object({
        elevenLabsConversationId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.custom<typeof practiceSessions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    feedback: {
      method: 'POST' as const,
      path: '/api/practice-sessions/:id/feedback' as const,
      responses: {
        200: z.custom<typeof practiceSessions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ExperienceInput = z.infer<typeof api.experiences.create.input>;
export type StarAnswerInput = z.infer<typeof api.starAnswers.update.input>;
export type PracticeSessionInput = z.infer<typeof api.practiceSessions.create.input>;
export type PracticeTurnInput = z.infer<typeof api.practiceSessions.addTurn.input>;
