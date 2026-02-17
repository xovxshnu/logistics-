
import { db } from "./db";
import {
  teams, gameState, bids,
  type Team, type InsertTeam, type GameState, type Bid, type InsertBid
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamByName(name: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: Partial<Team>): Promise<Team>;
  resetTeamBalance(id: number): Promise<Team>;
  
  // Game State
  getGameState(): Promise<GameState>;
  updateGameState(updates: Partial<GameState>): Promise<GameState>;
  resetGame(type: 'round' | 'balance' | 'full'): Promise<void>;
  
  // Bids
  placeBid(bid: InsertBid): Promise<Bid>;
  getBidsForRound(roundNumber: number): Promise<Bid[]>;
  clearBidsForRound(roundNumber: number): Promise<void>;
  getAllBids(): Promise<Bid[]>;
}

export class DatabaseStorage implements IStorage {
  // === TEAMS ===
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(teams.id);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamByName(name: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.name, name));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, updates: Partial<Team>): Promise<Team> {
    const [updated] = await db.update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();
    return updated;
  }

  async resetTeamBalance(id: number): Promise<Team> {
    const [updated] = await db.update(teams)
      .set({ balance: 10000 })
      .where(eq(teams.id, id))
      .returning();
    return updated;
  }

  // === GAME STATE ===
  async getGameState(): Promise<GameState> {
    const [state] = await db.select().from(gameState);
    if (!state) {
      // Initialize if empty
      const [newState] = await db.insert(gameState).values({
        currentRound: 1,
        phase: 'lobby',
        isBiddingOpen: false
      }).returning();
      return newState;
    }
    return state;
  }

  async updateGameState(updates: Partial<GameState>): Promise<GameState> {
    // Ensure state exists
    await this.getGameState(); 
    
    // We assume ID 1 for the singleton state (or the first row)
    // Actually better to fetch the ID from getGameState but for now let's assume one row.
    // Let's rely on getGameState creating it if missing, then update.
    
    const [existing] = await db.select().from(gameState).limit(1);
    const id = existing ? existing.id : (await this.getGameState()).id;

    const [updated] = await db.update(gameState)
      .set(updates)
      .where(eq(gameState.id, id))
      .returning();
    return updated;
  }

  async resetGame(type: 'round' | 'balance' | 'full'): Promise<void> {
    if (type === 'round') {
      // Clear bids for current round (logic handled in routes/controller usually, but here we just reset state-ish things)
      // Actually clearing bids is separate.
      // Just reset phase
       await this.updateGameState({ phase: 'round_start', isBiddingOpen: false, activeTeamId: null, winningBidAmount: 0 });
    } else if (type === 'balance') {
      await db.update(teams).set({ balance: 10000 });
    } else if (type === 'full') {
      await db.delete(bids);
      await db.update(teams).set({ balance: 10000, hasSpun: false, isActive: true });
      await db.delete(gameState); // Will be re-created on get
      await this.getGameState(); // Re-init
    }
  }

  // === BIDS ===
  async placeBid(bid: InsertBid): Promise<Bid> {
    const [newBid] = await db.insert(bids).values(bid).returning();
    return newBid;
  }

  async getBidsForRound(roundNumber: number): Promise<Bid[]> {
    return await db.select().from(bids)
      .where(eq(bids.roundNumber, roundNumber))
      .orderBy(desc(bids.amount), sql`created_at ASC`); // Highest bid wins, tie-break by time
  }
  
  async getAllBids(): Promise<Bid[]> {
    return await db.select().from(bids);
  }

  async clearBidsForRound(roundNumber: number): Promise<void> {
    await db.delete(bids).where(eq(bids.roundNumber, roundNumber));
  }
}

export const storage = new DatabaseStorage();
