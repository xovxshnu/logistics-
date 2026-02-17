
import { z } from 'zod';
import { teams, gameState, bids, questions } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
  forbidden: z.object({ message: z.string() }),
};

export const api = {
  teams: {
    list: {
      method: 'GET' as const,
      path: '/api/teams' as const,
      responses: { 200: z.array(z.custom<typeof teams.$inferSelect>()) },
    },
    spin: {
      method: 'POST' as const,
      path: '/api/teams/:id/spin' as const,
      responses: { 200: z.custom<typeof teams.$inferSelect>() },
    },
    reset: {
      method: 'POST' as const,
      path: '/api/teams/:id/reset' as const,
      responses: { 200: z.custom<typeof teams.$inferSelect>() },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/teams/:id' as const,
      responses: { 200: z.custom<typeof teams.$inferSelect>() },
    }
  },
  game: {
    state: {
      method: 'GET' as const,
      path: '/api/game/state' as const,
      responses: { 200: z.custom<typeof gameState.$inferSelect>() },
    },
    update: {
      method: 'POST' as const,
      path: '/api/game/update' as const,
      input: z.object({
        phase: z.string().optional(),
        currentRound: z.number().optional(),
        currentQuestionId: z.number().optional(),
        isBiddingOpen: z.boolean().optional(),
        activeTeamId: z.number().nullable().optional(),
        winningBidAmount: z.number().nullable().optional(),
        password: z.string().optional(), // For admin protection
      }),
      responses: {
        200: z.custom<typeof gameState.$inferSelect>(),
        403: errorSchemas.forbidden,
      },
    },
    reset: {
      method: 'POST' as const,
      path: '/api/game/reset' as const,
      input: z.object({
        type: z.enum(['round', 'balance', 'full']),
        password: z.string(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.forbidden,
      }
    },
    submitAnswer: {
      method: 'POST' as const,
      path: '/api/game/answer' as const,
      input: z.object({
        teamId: z.number(),
        option: z.string(), // 'A', 'B', 'C', 'D'
      }),
      responses: {
        200: z.object({ correct: z.boolean(), newBalance: z.number(), correctAnswer: z.string() }),
        400: errorSchemas.validation,
      }
    }
  },
  questions: {
    current: {
      method: 'GET' as const,
      path: '/api/questions/current' as const,
      responses: {
        200: z.custom<typeof questions.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  bids: {
    place: {
      method: 'POST' as const,
      path: '/api/bids' as const,
      input: z.object({
        teamId: z.number(),
        amount: z.number()
      }),
      responses: {
        201: z.custom<typeof bids.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    current: {
      method: 'GET' as const,
      path: '/api/bids/current' as const,
      responses: { 200: z.array(z.custom<typeof bids.$inferSelect>()) },
    }
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
