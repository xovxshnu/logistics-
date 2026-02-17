import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTeams, useSpinTeam } from '@/hooks/use-game';
import { NeonButton } from '@/components/NeonButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, ArrowRight, Ship, Package } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { data: teams, isLoading } = useTeams();
  const spinMutation = useSpinTeam();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  if (isLoading || !teams) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-display">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <h2 className="text-xl tracking-widest">LOADING TEAMS...</h2>
      </div>
    </div>
  );

  const availableTeams = teams.filter(t => !t.hasSpun && t.isActive);

  const handleSpin = (teamId: number) => {
    if (isSpinning) return;

    setIsSpinning(true);

    // Calculate rotation to land on selected team
    // 5 teams = 72 degrees per segment
    const teamIndex = availableTeams.findIndex(t => t.id === teamId);
    const segmentAngle = 360 / 5;
    const targetAngle = teamIndex * segmentAngle;

    // Add multiple full rotations for effect (4 full spins + target)
    const finalRotation = 360 * 4 + targetAngle;
    setWheelRotation(finalRotation);

    // After 4 seconds, complete the spin
    setTimeout(() => {
      setSelectedTeamId(teamId);
      setIsSpinning(false);

      // Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#06b6d4', '#ffffff']
      });

      // Update backend state
      spinMutation.mutate(teamId);
    }, 4000);
  };

  const handleEnterDashboard = () => {
    if (selectedTeamId) {
      setLocation(`/team/${selectedTeamId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Logistics Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {/* Moving container grid */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(251, 191, 36, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(251, 191, 36, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
          animate={{
            x: [0, -60],
            y: [0, -60],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Animated cargo ship silhouette */}
        <motion.div
          className="absolute bottom-20 left-0"
          animate={{
            x: [-200, window.innerWidth + 200],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Ship className="w-32 h-32 text-primary opacity-20" />
        </motion.div>

        {/* Floating packages */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 20}%`,
              top: `${10 + i * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            <Package className="w-12 h-12 text-cyan-500 opacity-20" />
          </motion.div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-6xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary mb-4 drop-shadow-2xl">
            LOGISTICS QUIZ
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-light tracking-[0.5em] uppercase">
            Chess Not Panic Edition
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedTeamId ? (
            <motion.div
              key="spinner"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-12 rounded-3xl border-primary/20 neon-border max-w-2xl mx-auto"
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

              {/* Spin Wheel Visualization */}
              {availableTeams.length > 0 && (
                <div className="mb-8">
                  <motion.div
                    className="relative w-64 h-64 mx-auto"
                    animate={{ rotate: wheelRotation }}
                    transition={{ duration: 4, ease: "easeOut" }}
                  >
                    {/* Wheel segments */}
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(251, 191, 36, 0.3)" strokeWidth="2" />
                      {availableTeams.slice(0, 5).map((team, index) => {
                        const angle = (360 / 5) * index;
                        const nextAngle = (360 / 5) * (index + 1);
                        const startRad = (angle - 90) * (Math.PI / 180);
                        const endRad = (nextAngle - 90) * (Math.PI / 180);

                        const x1 = 100 + 90 * Math.cos(startRad);
                        const y1 = 100 + 90 * Math.sin(startRad);
                        const x2 = 100 + 90 * Math.cos(endRad);
                        const y2 = 100 + 90 * Math.sin(endRad);

                        const colors = ['#fbbf24', '#06b6d4', '#f59e0b', '#0ea5e9', '#facc15'];

                        return (
                          <g key={team.id}>
                            <path
                              d={`M 100 100 L ${x1} ${y1} A 90 90 0 0 1 ${x2} ${y2} Z`}
                              fill={colors[index % colors.length]}
                              opacity="0.3"
                              stroke="rgba(255,255,255,0.2)"
                              strokeWidth="1"
                            />
                            <text
                              x="100"
                              y="100"
                              transform={`rotate(${angle + 36} 100 100)`}
                              textAnchor="middle"
                              dy="40"
                              className="fill-white text-xs font-bold"
                            >
                              {team.name}
                            </text>
                          </g>
                        );
                      })}
                      {/* Center circle */}
                      <circle cx="100" cy="100" r="20" fill="rgba(15, 23, 42, 0.9)" stroke="#fbbf24" strokeWidth="2" />
                    </svg>

                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                      <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-primary drop-shadow-lg" />
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Team Selection Buttons */}
              {availableTeams.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400 mb-4">Select your team to spin:</p>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {availableTeams.map((team) => (
                      <NeonButton
                        key={team.id}
                        size="lg"
                        onClick={() => handleSpin(team.id)}
                        disabled={isSpinning}
                        className="w-full"
                      >
                        {team.name}
                      </NeonButton>
                    ))}
                  </div>
                </div>
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
