
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- ADMIN AUTH HELPER ---
  const checkAdmin = (password?: string) => {
    if (password !== "admin123") {
      throw new Error("Unauthorized");
    }
  };

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
      const { password, ...updates } = api.game.update.input.parse(req.body);
      checkAdmin(password);
      
      const state = await storage.updateGameState(updates);
      res.json(state);
    } catch (err: any) {
      if (err.message === "Unauthorized") {
        return res.status(403).json({ message: "Invalid admin password" });
      }
      res.status(400).json({ message: "Invalid update" });
    }
  });

  app.post(api.game.reset.path, async (req, res) => {
    try {
      const { type, password } = api.game.reset.input.parse(req.body);
      checkAdmin(password);
      
      await storage.resetGame(type);
      res.json({ success: true });
    } catch (err: any) {
      if (err.message === "Unauthorized") {
        return res.status(403).json({ message: "Invalid admin password" });
      }
      res.status(400).json({ message: "Invalid reset" });
    }
  });

  // --- QUESTIONS ---
  app.get(api.questions.current.path, async (req, res) => {
    const state = await storage.getGameState();
    if (!state.currentQuestionId) {
      return res.status(404).json({ message: "No active question" });
    }
    const q = await storage.getQuestion(state.currentQuestionId);
    if (!q) return res.status(404).json({ message: "Question not found" });
    res.json(q);
  });

  app.post(api.game.submitAnswer.path, async (req, res) => {
    try {
      const { teamId, option } = api.game.submitAnswer.input.parse(req.body);
      const state = await storage.getGameState();
      if (state.phase !== 'question' || state.activeTeamId !== teamId) {
        return res.status(400).json({ message: "Not your turn or wrong phase" });
      }

      const q = await storage.getQuestion(state.currentQuestionId!);
      const team = await storage.getTeam(teamId);
      if (!q || !team) return res.status(400).json({ message: "Data missing" });

      const correct = q.correctOption === option;
      const bid = state.winningBidAmount || 0;
      const newBalance = correct ? team.balance + bid : team.balance - bid;

      await storage.updateTeam(teamId, { balance: newBalance });
      await storage.updateGameState({ phase: 'scoring' });

      res.json({ correct, newBalance, correctAnswer: q.correctOption });
    } catch (err) {
      res.status(400).json({ message: "Invalid submission" });
    }
  });

  // --- BIDS ---
  app.post(api.bids.place.path, async (req, res) => {
    try {
      const { teamId, amount } = api.bids.place.input.parse(req.body);
      const state = await storage.getGameState();
      
      if (!state.isBiddingOpen) return res.status(400).json({ message: "Bidding closed" });
      if (state.biddingEndsAt && new Date() > new Date(state.biddingEndsAt)) {
        return res.status(400).json({ message: "Timer expired" });
      }

      const team = await storage.getTeam(teamId);
      if (!team || amount > team.balance) return res.status(400).json({ message: "Invalid bid" });

      await storage.placeBid({ teamId, amount, roundNumber: state.currentRound });
      res.status(201).json({ teamId, amount });
    } catch (err) {
      res.status(400).json({ message: "Invalid bid" });
    }
  });

  app.get(api.bids.current.path, async (req, res) => {
    const state = await storage.getGameState();
    const b = await storage.getBidsForRound(state.currentRound);
    res.json(b);
  });

  await seedDatabase();
  return httpServer;
}

async function seedDatabase() {
  const existingTeams = await storage.getTeams();
  if (existingTeams.length === 0) {
    const tNames = ["ALPHA", "NOVA", "ZENITH", "TITAN", "NEXUS"];
    for (const name of tNames) {
      await storage.createTeam({ name, balance: 10000, isActive: true, hasSpun: false });
    }
  }

  const existingQs = await storage.getQuestions();
  if (existingQs.length === 0) {
    const qs = [
      { questionText: "Which company is the world’s largest container shipping company (2025)?", optionA: "CMA CGM", optionB: "MSC", optionC: "Maersk", optionD: "Hapag-Lloyd", correctOption: "B", explanation: "MSC (Mediterranean Shipping Company)" },
      { questionText: "Which company operates India’s largest logistics and supply chain network for e-commerce?", optionA: "DHL", optionB: "Blue Dart", optionC: "Delhivery", optionD: "DTDC", correctOption: "C", explanation: "Delhivery" },
      { questionText: "Which Indian company owns the largest container port in India (Mundra Port)?", optionA: "Reliance", optionB: "Tata Group", optionC: "Adani Group", optionD: "L&T", correctOption: "C", explanation: "Adani Group" },
      { questionText: "Which organization is responsible for public health globally?", optionA: "WHO", optionB: "UNICEF", optionC: "Red Cross", optionD: "UNESCO", correctOption: "A", explanation: "WHO (World Health Organization)" },
      { questionText: "Which logistics system keeps vaccines at correct temperature?", optionA: "Warm Chain", optionB: "Cold Chain", optionC: "Supply Chain", optionD: "Storage Chain", correctOption: "B", explanation: "Cold Chain" },
      { questionText: "How many high-speed rail corridors were announced in Budget 2026?", optionA: "3", optionB: "5", optionC: "7", optionD: "10", correctOption: "C", explanation: "7 high-speed rail corridors" },
      { questionText: "Which tax rate was reduced from 15% to 14% in Budget 2026?", optionA: "GST", optionB: "Corporate Tax", optionC: "MAT", optionD: "Income Tax", correctOption: "C", explanation: "MAT rate reduced to 14%" },
      { questionText: "What major mission was launched to improve semiconductor manufacturing?", optionA: "Digital India", optionB: "Startup India", optionC: "Semiconductor Mission 2.0", optionD: "Make in India", correctOption: "C", explanation: "Semiconductor Mission 2.0" },
      { questionText: "Which company is one of the largest employers in India (600k+)?", optionA: "Infosys", optionB: "TCS", optionC: "Wipro", optionD: "Reliance", correctOption: "B", explanation: "TCS (Tata Consultancy Services)" },
      { questionText: "What is the process of training new employees called?", optionA: "Recruitment", optionB: "Selection", optionC: "Onboarding", optionD: "Promotion", correctOption: "C", explanation: "Onboarding" }
    ];
    for (const q of qs) {
      await storage.createQuestion(q);
    }
  }
}
