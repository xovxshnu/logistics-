
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- TEAMS ---
  app.get(api.teams.list.path, async (req, res) => {
    const teams = await storage.getTeams();
    res.json(teams);
  });

  app.post(api.teams.spin.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const team = await storage.updateTeam(id, { hasSpun: true });
    res.json(team);
  });

  app.post(api.teams.reset.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const team = await storage.resetTeamBalance(id);
    res.json(team);
  });

  app.delete(api.teams.remove.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const team = await storage.updateTeam(id, { isActive: false });
    res.json(team);
  });

  // --- GAME STATE ---
  app.get(api.game.state.path, async (req, res) => {
    const state = await storage.getGameState();
    res.json(state);
  });

  app.post(api.game.update.path, async (req, res) => {
    try {
      const updates = api.game.update.input.parse(req.body);
      const state = await storage.updateGameState(updates);
      res.json(state);
    } catch (err) {
      res.status(400).json({ message: "Invalid update" });
    }
  });

  app.post(api.game.reset.path, async (req, res) => {
    try {
      const { type } = api.game.reset.input.parse(req.body);
      
      if (type === 'round') {
        const state = await storage.getGameState();
        await storage.clearBidsForRound(state.currentRound);
        await storage.updateGameState({ 
          phase: 'round_start', 
          isBiddingOpen: false, 
          activeTeamId: null, 
          winningBidAmount: 0 
        });
      } else if (type === 'balance') {
        await storage.resetGame('balance');
      } else if (type === 'full') {
        await storage.resetGame('full');
      }
      
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: "Invalid reset type" });
    }
  });

  // --- BIDS ---
  app.post(api.bids.place.path, async (req, res) => {
    try {
      const { teamId, amount } = api.bids.place.input.parse(req.body);
      const state = await storage.getGameState();
      const team = await storage.getTeam(teamId);

      // Validations
      if (!state.isBiddingOpen) {
        return res.status(400).json({ message: "Bidding is closed" });
      }
      if (!team || !team.isActive) {
        return res.status(400).json({ message: "Invalid team" });
      }
      if (amount > team.balance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      if (amount <= 0) {
        return res.status(400).json({ message: "Bid must be positive" });
      }

      const bid = await storage.placeBid({
        teamId,
        amount,
        roundNumber: state.currentRound
      });

      res.status(201).json(bid);
    } catch (err) {
      res.status(400).json({ message: "Invalid bid" });
    }
  });

  app.get(api.bids.currentRound.path, async (req, res) => {
    const state = await storage.getGameState();
    const bids = await storage.getBidsForRound(state.currentRound);
    res.json(bids);
  });

  // --- SEEDING ---
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingTeams = await storage.getTeams();
  if (existingTeams.length === 0) {
    const teams = ["ALPHA", "NOVA", "ZENITH", "TITAN", "NEXUS"];
    for (const name of teams) {
      await storage.createTeam({
        name,
        balance: 10000,
        isActive: true,
        hasSpun: false
      });
    }
  }
}
