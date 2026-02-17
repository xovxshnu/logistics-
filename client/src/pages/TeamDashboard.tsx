import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useTeam, useGameState, usePlaceBid, useCurrentQuestion } from '@/hooks/use-game';
import { NeonButton } from '@/components/NeonButton';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Coins, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

// Animated counter component
function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

// Countdown timer component
function CountdownTimer({ endsAt }: { endsAt: Date | null }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!endsAt || timeLeft === 0) return null;

  const urgencyColor = timeLeft > 20 ? 'text-green-400' : timeLeft > 10 ? 'text-yellow-400' : 'text-red-400';
  const glowColor = timeLeft > 20 ? 'shadow-green-500/50' : timeLeft > 10 ? 'shadow-yellow-500/50' : 'shadow-red-500/50';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center justify-center gap-2 p-4 rounded-lg bg-slate-900/50 border ${urgencyColor} border-current`}
    >
      <Clock className={`w-6 h-6 ${urgencyColor} ${timeLeft <= 10 ? 'animate-pulse' : ''}`} />
      <div className="text-center">
        <div className={`text-4xl font-mono font-bold ${urgencyColor} ${glowColor} shadow-lg`}>
          {timeLeft}s
        </div>
        <div className="text-xs text-slate-400 uppercase tracking-wider">Time Remaining</div>
      </div>
    </motion.div>
  );
}

export default function TeamDashboard() {
  const [match, params] = useRoute('/team/:id');
  const teamId = params ? parseInt(params.id) : 0;

  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { data: gameState, isLoading: gameLoading } = useGameState();
  const { data: currentQuestion } = useCurrentQuestion();
  const placeBidMutation = usePlaceBid();
  const { toast } = useToast();

  const [bidAmount, setBidAmount] = useState<string>('');
  const [prevBalance, setPrevBalance] = useState<number>(0);

  // Track balance changes for glow effect
  useEffect(() => {
    if (team && team.balance !== prevBalance) {
      setPrevBalance(team.balance);
    }
  }, [team, prevBalance]);

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

  // Check if bidding timer has expired
  const timerExpired = gameState.biddingEndsAt && new Date() > new Date(gameState.biddingEndsAt);
  const isBiddingEnabled = gameState.isBiddingOpen && gameState.phase === 'bidding' && !timerExpired;
  const isActiveTeam = gameState.activeTeamId === team.id;

  // Determine balance glow color
  const balanceGlow = prevBalance > 0 && team.balance > prevBalance
    ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]'
    : prevBalance > 0 && team.balance < prevBalance
      ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]'
      : '';

  return (
    <div className="min-h-screen bg-slate-950 text-white font-body selection:bg-primary/30">
      {/* Top Bar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">
              {team.name}
            </h1>
            <StatusBadge phase={gameState.phase} isBiddingOpen={gameState.isBiddingOpen} className="hidden md:flex" />
          </div>

          {/* Enhanced Scorecard */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Balance</div>
              <div className={`text-xl md:text-2xl font-mono font-bold transition-all duration-300 ${balanceGlow}`}>
                $<AnimatedCounter value={team.balance} />
              </div>
            </div>

            <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Round</div>
              <div className="text-xl md:text-2xl font-mono font-bold text-white">
                {gameState.currentRound}
              </div>
            </div>

            {gameState.currentQuestionId && (
              <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5 col-span-2 md:col-span-1">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Question</div>
                <div className="text-xl md:text-2xl font-mono font-bold text-primary">
                  #{gameState.currentQuestionId}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Mobile Status Badge */}
        <div className="md:hidden mb-6 flex justify-center">
          <StatusBadge phase={gameState.phase} isBiddingOpen={gameState.isBiddingOpen} />
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
              className="space-y-6"
            >
              {/* Timer */}
              {gameState.biddingEndsAt && (
                <CountdownTimer endsAt={gameState.biddingEndsAt} />
              )}

              {/* Question Number Only (Hidden Details) */}
              <div className="glass-panel p-6 rounded-2xl border-primary/20 neon-border text-center">
                <h2 className="text-2xl font-display font-bold mb-2">
                  Round {gameState.currentRound} – Question {gameState.currentQuestionId || '?'}
                </h2>
                <p className="text-slate-400">Place your bid to answer this question</p>
              </div>

              {/* Bidding Interface */}
              <div className="glass-panel p-6 md:p-8 rounded-2xl border-primary/20 neon-border">
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
                      {timerExpired ? 'TIME EXPIRED - BIDDING LOCKED' : 'BIDDING IS CURRENTLY LOCKED'}
                    </p>
                  )}
                </div>
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
                    gameState.phase === 'bidding_locked' ? "BIDDING LOCKED - REVEALING WINNER..." :
                      gameState.phase === 'ended' ? "GAME OVER - THANKS FOR PLAYING!" :
                        "WAITING FOR HOST..."}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
