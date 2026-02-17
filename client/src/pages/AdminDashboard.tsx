import { useState } from 'react';
import { useGameState, useUpdateGameState, useTeams, useResetGame, useCurrentBids } from '@/hooks/use-game';
import { NeonButton } from '@/components/NeonButton';
import { TeamCard } from '@/components/TeamCard';
import { StatusBadge } from '@/components/StatusBadge';
import { GameState, Team } from '@shared/schema';
import { 
  Play, Pause, Lock, Unlock, RefreshCw, Trophy, 
  ChevronRight, AlertTriangle, ArrowUpCircle, Check, X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminDashboard() {
  const { data: gameState } = useGameState();
  const { data: teams } = useTeams();
  const { data: bids } = useCurrentBids();
  
  const updateGameMutation = useUpdateGameState();
  const resetGameMutation = useResetGame();
  
  // Local loading state handling for smoother UI
  const isUpdating = updateGameMutation.isPending;

  if (!gameState || !teams) return <div className="p-8 text-white">Loading Admin...</div>;

  // Sort teams by balance for scoreboard
  const sortedTeams = [...teams].sort((a, b) => b.balance - a.balance);

  // Identify winning bid
  const winningBid = bids && bids.length > 0 
    ? bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
    : null;

  const handlePhaseChange = (phase: GameState['phase']) => {
    updateGameMutation.mutate({ phase });
  };

  const toggleBidding = () => {
    updateGameMutation.mutate({ isBiddingOpen: !gameState.isBiddingOpen });
  };

  const nextRound = () => {
    updateGameMutation.mutate({ 
      currentRound: gameState.currentRound + 1,
      phase: 'round_start',
      isBiddingOpen: false,
      activeTeamId: null,
      winningBidAmount: 0
    });
  };

  const revealActiveTeam = () => {
    if (winningBid) {
      updateGameMutation.mutate({ 
        activeTeamId: winningBid.teamId,
        winningBidAmount: winningBid.amount,
        phase: 'question'
      });
    }
  };

  const handleReset = (type: 'round' | 'balance' | 'full') => {
    resetGameMutation.mutate(type);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-body p-6">
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">ADMIN COMMAND CENTER</h1>
          <div className="flex gap-4 mt-2">
            <StatusBadge phase={gameState.phase} isBiddingOpen={gameState.isBiddingOpen} />
            <Badge variant="secondary" className="font-mono">ROUND {gameState.currentRound}</Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <NeonButton variant="danger" size="sm">RESET GAME</NeonButton>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will reset all balances, team spins, and game progress to the start.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 text-white hover:bg-slate-700">Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleReset('full')}>
                  Yes, Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COL: CONTROLS (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Phase Controls */}
          <div className="glass-panel p-6 rounded-xl border-slate-800">
            <h3 className="text-slate-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
              <Play className="w-4 h-4" /> Game Flow
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <NeonButton 
                variant={gameState.phase === 'round_start' ? 'primary' : 'outline'}
                className="justify-start text-left"
                onClick={() => handlePhaseChange('round_start')}
                disabled={isUpdating}
              >
                1. Round Start
              </NeonButton>
              
              <NeonButton 
                variant={gameState.phase === 'bidding' ? 'primary' : 'outline'}
                className="justify-start text-left"
                onClick={() => handlePhaseChange('bidding')}
                disabled={isUpdating}
              >
                2. Bidding Phase
              </NeonButton>
              
              <NeonButton 
                variant={gameState.phase === 'bidding_locked' ? 'primary' : 'outline'}
                className="justify-start text-left"
                onClick={() => handlePhaseChange('bidding_locked')}
                disabled={isUpdating}
              >
                3. Lock Bids
              </NeonButton>

              <NeonButton 
                variant={gameState.phase === 'question' ? 'primary' : 'outline'}
                className="justify-start text-left"
                onClick={() => handlePhaseChange('question')}
                disabled={isUpdating}
              >
                4. Question Time
              </NeonButton>

              <NeonButton 
                variant={gameState.phase === 'scoring' ? 'primary' : 'outline'}
                className="justify-start text-left"
                onClick={() => handlePhaseChange('scoring')}
                disabled={isUpdating}
              >
                5. Show Scores
              </NeonButton>
            </div>
          </div>

          {/* Action Controls */}
          <div className="glass-panel p-6 rounded-xl border-slate-800">
            <h3 className="text-slate-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Actions
            </h3>
            
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <NeonButton 
                  size="sm" 
                  variant={gameState.isBiddingOpen ? "danger" : "secondary"}
                  onClick={toggleBidding}
                  disabled={isUpdating}
                >
                  {gameState.isBiddingOpen ? <><Lock className="w-4 h-4 mr-1"/> Close</> : <><Unlock className="w-4 h-4 mr-1"/> Open</>}
                </NeonButton>

                <NeonButton 
                  size="sm" 
                  variant="outline"
                  onClick={revealActiveTeam}
                  disabled={isUpdating || !winningBid}
                >
                  <Trophy className="w-4 h-4 mr-1" /> Reveal Winner
                </NeonButton>
              </div>

              <NeonButton 
                variant="secondary"
                className="w-full mt-2"
                onClick={nextRound}
                disabled={isUpdating}
              >
                NEXT ROUND <ChevronRight className="w-4 h-4 ml-1" />
              </NeonButton>
            </div>
          </div>
        </div>

        {/* MIDDLE COL: SCOREBOARD (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-6 rounded-xl border-slate-800 h-full min-h-[500px]">
            <h2 className="text-xl font-display font-bold text-center mb-6 tracking-widest text-slate-300">
              LIVE LEADERBOARD
            </h2>

            <div className="space-y-3">
              {sortedTeams.map((team, index) => (
                <TeamCard 
                  key={team.id} 
                  team={team} 
                  rank={index + 1}
                  isActive={team.id === gameState.activeTeamId}
                />
              ))}
            </div>

            {/* Active Round Info */}
            <div className="mt-8 pt-8 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="bg-slate-900/50 p-4 rounded-lg">
                   <div className="text-slate-500 text-xs uppercase mb-1">Total Bids</div>
                   <div className="text-2xl font-mono font-bold">{bids?.length || 0}</div>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-lg">
                   <div className="text-slate-500 text-xs uppercase mb-1">Highest Bid</div>
                   <div className="text-2xl font-mono font-bold text-primary">
                     ${winningBid?.amount.toLocaleString() || 0}
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: BIDS LOG (3 cols) */}
        <div className="lg:col-span-3">
          <div className="glass-panel p-6 rounded-xl border-slate-800 h-full flex flex-col">
            <h3 className="text-slate-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4" /> Incoming Bids
            </h3>
            
            <ScrollArea className="flex-1 pr-4 max-h-[600px]">
              <div className="space-y-2">
                {bids && bids.length > 0 ? (
                  // Sort bids high to low for display
                  [...bids].sort((a,b) => b.amount - a.amount).map((bid) => {
                    const team = teams.find(t => t.id === bid.teamId);
                    const isWinning = winningBid?.id === bid.id;

                    return (
                      <div 
                        key={bid.id} 
                        className={`flex justify-between items-center p-3 rounded text-sm ${
                          isWinning ? 'bg-primary/20 border border-primary/50' : 'bg-slate-900 border border-slate-800'
                        }`}
                      >
                        <div className="font-semibold">
                          {team?.name || 'Unknown'}
                          {isWinning && <Trophy className="w-3 h-3 text-primary inline ml-2" />}
                        </div>
                        <div className={`font-mono font-bold ${isWinning ? 'text-primary' : 'text-slate-400'}`}>
                          ${bid.amount.toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-600 italic py-8">
                    No bids placed this round yet.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
