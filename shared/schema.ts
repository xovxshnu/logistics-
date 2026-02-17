
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TEAMS ===
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  balance: integer("balance").notNull().default(10000),
  isActive: boolean("is_active").notNull().default(true),
  hasSpun: boolean("has_spun").notNull().default(false),
});

// === QUESTIONS ===
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: text("correct_option").notNull(), // 'A', 'B', 'C', or 'D'
  explanation: text("explanation"),
});

// === GAME STATE ===
export const gameState = pgTable("game_state", {
  id: serial("id").primaryKey(),
  currentRound: integer("current_round").notNull().default(1),
  currentQuestionId: integer("current_question_id"),
  phase: text("phase").notNull().default("lobby"), // 'lobby', 'bidding', 'bidding_locked', 'question', 'scoring', 'ended'
  isBiddingOpen: boolean("is_bidding_open").notNull().default(false),
  activeTeamId: integer("active_team_id"), // Winner of bidding
  winningBidAmount: integer("winning_bid_amount"),
  biddingEndsAt: timestamp("bidding_ends_at"), // For 30s timer
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
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertGameStateSchema = createInsertSchema(gameState).omit({ id: true });
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, createdAt: true });

// === TYPES ===
export type Team = typeof teams.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type GameState = typeof gameState.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
