
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TEAM DATA ===
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  balance: integer("balance").notNull().default(10000),
  isActive: boolean("is_active").notNull().default(true),
  hasSpun: boolean("has_spun").notNull().default(false), // Tracks if team has entered via wheel
});

// === GAME STATE ===
// We'll use a single row with ID=1 to store global game state
export const gameState = pgTable("game_state", {
  id: serial("id").primaryKey(),
  currentRound: integer("current_round").notNull().default(1),
  // Phases: 
  // 'lobby' (waiting for teams to spin), 
  // 'round_start' (round announced),
  // 'bidding' (bidding is open), 
  // 'bidding_locked' (no more bids), 
  // 'question' (winning team answering), 
  // 'scoring' (showing results), 
  // 'ended' (game over)
  phase: text("phase").notNull().default("lobby"),
  isBiddingOpen: boolean("is_bidding_open").notNull().default(false),
  activeTeamId: integer("active_team_id"), // The team currently answering (winning bidder)
  winningBidAmount: integer("winning_bid_amount"), // The highest bid for current round
});

// === BIDS ===
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  roundNumber: integer("round_number").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertGameStateSchema = createInsertSchema(gameState).omit({ id: true });
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, createdAt: true });

// === TYPES ===
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type GameState = typeof gameState.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
