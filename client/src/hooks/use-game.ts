import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { GameState, Team, Bid } from "@shared/schema";

// --- GAME STATE HOOKS ---

export function useGameState() {
  return useQuery({
    queryKey: [api.game.state.path],
    queryFn: async () => {
      const res = await fetch(api.game.state.path);
      if (!res.ok) throw new Error("Failed to fetch game state");
      return api.game.state.responses[200].parse(await res.json());
    },
    refetchInterval: 1000, // Poll every second for real-time updates
  });
}

export function useUpdateGameState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<GameState>) => {
      // Ensure we send only valid fields defined in the schema
      const payload = {
        phase: updates.phase,
        currentRound: updates.currentRound,
        isBiddingOpen: updates.isBiddingOpen,
        activeTeamId: updates.activeTeamId,
        winningBidAmount: updates.winningBidAmount,
      };

      const res = await fetch(api.game.update.path, {
        method: api.game.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update game state");
      return api.game.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] });
    },
  });
}

export function useResetGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type: 'round' | 'balance' | 'full') => {
      const res = await fetch(api.game.reset.path, {
        method: api.game.reset.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Failed to reset game");
      return api.game.reset.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] });
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.bids.currentRound.path] });
    },
  });
}

// --- TEAM HOOKS ---

export function useTeams() {
  return useQuery({
    queryKey: [api.teams.list.path],
    queryFn: async () => {
      const res = await fetch(api.teams.list.path);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return api.teams.list.responses[200].parse(await res.json());
    },
    refetchInterval: 1000,
  });
}

export function useTeam(id: number) {
  // Using select to filter from the list cache to avoid N+1 fetches if possible, 
  // but since we need fresh balance, polling the list is safer.
  const { data: teams, ...rest } = useTeams();
  const team = teams?.find(t => t.id === id);
  return { data: team, ...rest };
}

export function useSpinTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.teams.spin.path, { id });
      const res = await fetch(url, { method: api.teams.spin.method });
      if (!res.ok) throw new Error("Failed to spin team");
      return api.teams.spin.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path] });
    },
  });
}

export function useResetTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.teams.reset.path, { id });
      const res = await fetch(url, { method: api.teams.reset.method });
      if (!res.ok) throw new Error("Failed to reset team");
      return api.teams.reset.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path] });
    },
  });
}

// --- BID HOOKS ---

export function useCurrentBids() {
  return useQuery({
    queryKey: [api.bids.currentRound.path],
    queryFn: async () => {
      const res = await fetch(api.bids.currentRound.path);
      if (!res.ok) throw new Error("Failed to fetch bids");
      return api.bids.currentRound.responses[200].parse(await res.json());
    },
    refetchInterval: 1000,
  });
}

export function usePlaceBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { teamId: number; amount: number }) => {
      const res = await fetch(api.bids.place.path, {
        method: api.bids.place.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          // Try to parse the specific validation error
          try {
            const err = await res.json();
            throw new Error(err.message || "Invalid bid");
          } catch (e) {
            throw new Error("Bid failed");
          }
        }
        throw new Error("Failed to place bid");
      }
      return api.bids.place.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bids.currentRound.path] });
      queryClient.invalidateQueries({ queryKey: [api.teams.list.path] }); // Balance updates
      queryClient.invalidateQueries({ queryKey: [api.game.state.path] }); // Winning bid updates
    },
  });
}

// --- QUESTION HOOKS ---

export function useCurrentQuestion() {
  return useQuery({
    queryKey: [api.questions.current.path],
    queryFn: async () => {
      const res = await fetch(api.questions.current.path);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch current question");
      }
      return api.questions.current.responses[200].parse(await res.json());
    },
    refetchInterval: 1000,
  });
}
