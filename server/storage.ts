
import { db } from "./db";
import {
  teams, gameState, bids, questions,
  type Team, type InsertTeam, type GameState, type Bid, type InsertBid, type Question
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: Partial<Team>): Promise<Team>;
  resetTeamBalance(id: number): Promise<Team>;
  
  getGameState(): Promise<GameState>;
  updateGameState(updates: Partial<GameState>): Promise<GameState>;
  resetGame(type: 'round' | 'balance' | 'full'): Promise<void>;
  
  getQuestions(): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(q: any): Promise<Question>;

  placeBid(bid: InsertBid): Promise<Bid>;
  getBidsForRound(roundNumber: number): Promise<Bid[]>;
  clearBidsForRound(roundNumber: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(teams.id);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, updates: Partial<Team>): Promise<Team> {
    const [updated] = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
    return updated;
  }

  async resetTeamBalance(id: number): Promise<Team> {
    const [updated] = await db.update(teams).set({ balance: 10000 }).where(eq(teams.id, id)).returning();
    return updated;
  }

  async getGameState(): Promise<GameState> {
    const [state] = await db.select().from(gameState);
    if (!state) {
      const [newState] = await db.insert(gameState).values({ phase: 'lobby' }).returning();
      return newState;
    }
    return state;
  }

  async updateGameState(updates: Partial<GameState>): Promise<GameState> {
    const state = await this.getGameState();
    const [updated] = await db.update(gameState).set(updates).where(eq(gameState.id, state.id)).returning();
    return updated;
  }

  async resetGame(type: 'round' | 'balance' | 'full'): Promise<void> {
    if (type === 'round') {
      const state = await this.getGameState();
      await this.clearBidsForRound(state.currentRound);
      await this.updateGameState({ phase: 'bidding', isBiddingOpen: true, activeTeamId: null, winningBidAmount: 0, biddingEndsAt: new Date(Date.now() + 30000) });
    } else if (type === 'balance') {
      await db.update(teams).set({ balance: 10000 });
    } else if (type === 'full') {
      await db.delete(bids);
      await db.update(teams).set({ balance: 10000, hasSpun: false, isActive: true });
      await db.delete(gameState);
      await this.getGameState();
    }
  }

  async getQuestions(): Promise<Question[]> {
    return await db.select().from(questions).orderBy(questions.id);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [q] = await db.select().from(questions).where(eq(questions.id, id));
    return q;
  }

  async createQuestion(q: any): Promise<Question> {
    const [newQ] = await db.insert(questions).values(q).returning();
    return newQ;
  }

  async placeBid(bid: InsertBid): Promise<Bid> {
    const [newBid] = await db.insert(bids).values(bid).returning();
    return newBid;
  }

  async getBidsForRound(roundNumber: number): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.roundNumber, roundNumber)).orderBy(desc(bids.amount), sql`created_at ASC`);
  }

  async clearBidsForRound(roundNumber: number): Promise<void> {
    await db.delete(bids).where(eq(bids.roundNumber, roundNumber));
  }
}

export const storage = new DatabaseStorage();
