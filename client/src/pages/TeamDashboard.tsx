import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useTeam, useGameState, usePlaceBid } from '@/hooks/use-game';
import { NeonButton } from '@/components/NeonButton';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TeamDashboard() {
  const [match, params] = useRoute('/team/:id');
  const teamId = params ? parseInt(params.id) : 0;
  
  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { data: gameState, isLoading: gameLoading } = useGameState();
  const placeBidMutation = usePlaceBid();
  const { toast } = useToast();

  const [bidAmount, setBidAmount] = useState<string>('');
  
  // Clear input when round changes
  useEffect(() => {
    setBidAmount('');
  }, [gameState?.currentRound]);

  if (teamLoading || gameLoading || !team || !gameState) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-primary">
      <div className="animate-spin text-4xl">⚙️</div>
    </div>
  );

  const handleBid = () => {
    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Bid", description: "Please enter a valid positive number.", variant: "destructive" });
      return;
    }
    if (amount > team.balance) {
      toast({ title: "Insufficient Funds", description: "You cannot bid more than your current balance.", variant: "destructive" });
      return;
    }

    placeBidMutation.mutate({ teamId, amount }, {
      onSuccess: () => {
        toast({ 
          title: "Bid Placed!", 
          description: `You bid $${amount} for Round ${gameState.currentRound}.`,
          className: "bg-primary border-primary text-black font-bold"
        });
        setBidAmount('');
      },
      onError: (err) => {
        toast({ title: "Bid Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const isBiddingEnabled = gameState.isBiddingOpen && gameState.phase === 'bidding';
  const isActiveTeam = gameState.activeTeamId === team.id;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-body selection:bg-primary/30">
      {/* Top Bar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">
              {team.name}
            </h1>
            <StatusBadge phase={gameState.phase} isBiddingOpen={gameState.isBiddingOpen} className="hidden md:flex" />
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 bg-slate-800/50 px-4 py-2 rounded-lg border border-white/5">
            <Coins className="w-5 h-5 text-primary" />
            <span className="text-sm md:text-base text-slate-400 uppercase tracking-wide">Balance</span>
            <span className="text-xl md:text-2xl font-mono font-bold text-white">${team.balance.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Mobile Status Badge */}
        <div className="md:hidden mb-6 flex justify-center">
          <StatusBadge phase={gameState.phase} isBiddingOpen={gameState.isBiddingOpen} />
        </div>

        {/* Round Indicator */}
        <div className="text-center mb-8">
          <span className="text-slate-500 uppercase tracking-[0.3em] text-sm">Current Round</span>
          <div className="text-6xl font-display font-black text-slate-800 select-none">
            {gameState.currentRound}
          </div>
        </div>

        {/* Game Area */}
        <AnimatePresence mode="wait">
          {/* Phase: BIDDING */}
          {gameState.phase === 'bidding' && (
            <motion.div
              key="bidding"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-6 md:p-8 rounded-2xl border-primary/20 neon-border"
            >
              <div className="text-center mb-6">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold font-display uppercase">Place Your Bid</h2>
                <p className="text-slate-400 mt-2">Highest unique bid wins the chance to answer.</p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    disabled={!isBiddingEnabled || placeBidMutation.isPending}
                    className="pl-8 text-3xl h-20 bg-black/40 border-slate-700 text-center font-mono focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <NeonButton 
                  size="xl" 
                  onClick={handleBid}
                  disabled={!isBiddingEnabled || !bidAmount}
                  isLoading={placeBidMutation.isPending}
                  className="w-full"
                >
                  SUBMIT BID
                </NeonButton>
                
                {!isBiddingEnabled && (
                  <p className="text-center text-red-400 text-sm font-semibold">
                    BIDDING IS CURRENTLY LOCKED
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Phase: QUESTION / ANSWERING */}
          {gameState.phase === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-panel p-8 rounded-2xl border ${isActiveTeam ? 'border-green-500/50' : 'border-slate-700'}`}
            >
              {isActiveTeam ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-3xl font-bold font-display text-green-400 mb-4">YOU WON THE BID!</h2>
                  <p className="text-xl">Look at the main screen and answer the question!</p>
                  <div className="mt-8 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm uppercase tracking-widest text-green-400">Winning Bid</p>
                    <p className="text-3xl font-mono font-bold">${gameState.winningBidAmount?.toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center opacity-75">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-slate-500" />
                  </div>
                  <h2 className="text-2xl font-bold font-display text-slate-300 mb-2">ANOTHER TEAM IS ANSWERING</h2>
                  <p className="text-slate-400">Wait for the next round.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Fallback for other phases (Lobby, Round Start, etc) */}
          {['lobby', 'round_start', 'scoring', 'bidding_locked', 'ended'].includes(gameState.phase) && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <h2 className="text-xl md:text-2xl font-display text-slate-500 uppercase tracking-widest animate-pulse">
                {gameState.phase === 'round_start' ? "PREPARE FOR NEXT ROUND..." :
                 gameState.phase === 'scoring' ? "CALCULATING SCORES..." :
                 gameState.phase === 'ended' ? "THANKS FOR PLAYING" :
                 "WAITING FOR HOST..."}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
