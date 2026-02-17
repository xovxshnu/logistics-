import { Team } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Trophy, Coins } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  isActive: boolean;
  rank: number;
}

export function TeamCard({ team, isActive, rank }: TeamCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "relative overflow-hidden border p-4 transition-all duration-300",
        isActive 
          ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(250,204,21,0.15)]" 
          : "border-white/5 bg-slate-900/50 hover:bg-slate-800/50 hover:border-white/10"
      )}>
        {/* Rank indicator background */}
        <div className="absolute -right-4 -top-4 text-[100px] font-bold text-white/[0.03] font-display leading-none select-none pointer-events-none">
          {rank}
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded font-bold font-display text-lg",
              isActive ? "bg-primary text-primary-foreground" : "bg-slate-800 text-slate-400"
            )}>
              {rank}
            </div>
            <div>
              <h3 className={cn(
                "font-display font-bold text-lg uppercase tracking-wider",
                isActive ? "text-primary text-shadow-glow" : "text-white"
              )}>
                {team.name}
              </h3>
              {isActive && (
                <span className="text-xs text-primary/80 font-semibold uppercase tracking-widest">
                  Active Bidder
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
              <Coins className="w-3 h-3" />
              <span>Balance</span>
            </div>
            <div className="font-mono text-2xl font-bold text-white">
              ${team.balance.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Active Indicator Bar */}
        {isActive && (
          <motion.div 
            layoutId="active-indicator"
            className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        )}
      </Card>
    </motion.div>
  );
}
