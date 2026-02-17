
import { z } from 'zod';
import { insertTeamSchema, insertBidSchema, teams, gameState, bids } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  conflict: z.object({
    message: z.string(),
  })
};

export const api = {
  teams: {
    list: {
      method: 'GET' as const,
      path: '/api/teams' as const,
      responses: {
        200: z.array(z.custom<typeof teams.$inferSelect>()),
      },
    },
    reset: { // Reset specific team balance
      method: 'POST' as const,
      path: '/api/teams/:id/reset' as const,
      responses: {
        200: z.custom<typeof teams.$inferSelect>(),
      }
    },
    remove: { // Soft delete or deactivate
      method: 'DELETE' as const,
      path: '/api/teams/:id' as const,
      responses: {
        200: z.custom<typeof teams.$inferSelect>(),
      }
    },
    spin: { // Mark team as spun/entered
      method: 'POST' as const,
      path: '/api/teams/:id/spin' as const,
      responses: {
        200: z.custom<typeof teams.$inferSelect>(),
      }
    }
  },
  game: {
    state: {
      method: 'GET' as const,
      path: '/api/game/state' as const,
      responses: {
        200: z.custom<typeof gameState.$inferSelect>(),
      },
    },
    update: { // Admin controls
      method: 'POST' as const,
      path: '/api/game/update' as const,
      input: z.object({
        phase: z.enum(['lobby', 'round_start', 'bidding', 'bidding_locked', 'question', 'scoring', 'ended']).optional(),
        currentRound: z.number().optional(),
        isBiddingOpen: z.boolean().optional(),
        activeTeamId: z.number().nullable().optional(),
        winningBidAmount: z.number().optional(),
      }),
      responses: {
        200: z.custom<typeof gameState.$inferSelect>(),
      },
    },
    reset: { // Full game reset
      method: 'POST' as const,
      path: '/api/game/reset' as const,
      input: z.object({
        type: z.enum(['round', 'balance', 'full'])
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
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
        400: errorSchemas.validation, // Bid too high or locked
      }
    },
    currentRound: {
      method: 'GET' as const,
      path: '/api/bids/current' as const,
      responses: {
        200: z.array(z.custom<typeof bids.$inferSelect>()),
      }
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
