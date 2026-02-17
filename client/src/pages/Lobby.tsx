import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTeams, useSpinTeam } from '@/hooks/use-game';
import { NeonButton } from '@/components/NeonButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { data: teams, isLoading } = useTeams();
  const spinMutation = useSpinTeam();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  if (isLoading || !teams) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-display">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <h2 className="text-xl tracking-widest">LOADING TEAMS...</h2>
      </div>
    </div>
  );

  const availableTeams = teams.filter(t => !t.hasSpun && t.isActive);

  const handleSpin = () => {
    if (availableTeams.length === 0) return;
    
    setIsSpinning(true);
    
    // Simulate spin duration
    setTimeout(() => {
      // Pick random team
      const randomIndex = Math.floor(Math.random() * availableTeams.length);
      const winner = availableTeams[randomIndex];
      
      setSelectedTeamId(winner.id);
      setIsSpinning(false);
      
      // Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#06b6d4', '#ffffff']
      });

      // Update backend state
      spinMutation.mutate(winner.id);
    }, 3000);
  };

  const handleEnterDashboard = () => {
    if (selectedTeamId) {
      setLocation(`/team/${selectedTeamId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-6xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary mb-4 drop-shadow-2xl">
            BID WARS
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-light tracking-[0.5em] uppercase">
            Esports Edition
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedTeamId ? (
            <motion.div
              key="spinner"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-12 rounded-3xl border-primary/20 neon-border max-w-xl mx-auto"
            >
              <div className="mb-8">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
                  <Trophy className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold mb-2">TEAM SELECTION</h2>
                <p className="text-slate-400">
                  {availableTeams.length} Teams Remaining
                </p>
              </div>

              {availableTeams.length > 0 ? (
                <NeonButton 
                  size="xl" 
                  onClick={handleSpin} 
                  isLoading={isSpinning}
                  className="w-full text-2xl"
                >
                  {isSpinning ? "CALIBRATING..." : "SPIN TO ENTER"}
                </NeonButton>
              ) : (
                <div className="text-red-400 font-bold border border-red-500/30 bg-red-500/10 p-4 rounded-xl">
                  ALL TEAMS ASSIGNED
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel p-12 rounded-3xl border-primary/50 shadow-[0_0_50px_rgba(250,204,21,0.2)] max-w-xl mx-auto"
            >
              <h3 className="text-slate-400 text-lg uppercase tracking-widest mb-4">You are Team</h3>
              <div className="text-6xl md:text-7xl font-display font-black text-primary mb-8 text-shadow-glow">
                {teams.find(t => t.id === selectedTeamId)?.name}
              </div>
              
              <NeonButton 
                size="xl" 
                variant="secondary"
                onClick={handleEnterDashboard}
                className="w-full flex items-center justify-center gap-3"
              >
                ENTER DASHBOARD <ArrowRight className="w-6 h-6" />
              </NeonButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Admin Link footer */}
      <div className="absolute bottom-8 text-slate-600 text-sm hover:text-slate-400 transition-colors">
        <a href="/admin">Admin Access</a>
      </div>
    </div>
  );
}
