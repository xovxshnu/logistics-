import { cn } from '@/lib/utils';
import { GameState } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  phase: GameState['phase'];
  isBiddingOpen: boolean;
  className?: string;
}

export function StatusBadge({ phase, isBiddingOpen, className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (phase === 'ended') return { label: 'GAME OVER', color: 'bg-red-500', animate: false };
    if (phase === 'lobby') return { label: 'LOBBY', color: 'bg-slate-500', animate: false };
    
    if (isBiddingOpen) {
      return { label: 'BIDDING OPEN', color: 'bg-green-500', animate: true };
    }
    
    switch (phase) {
      case 'round_start': return { label: 'ROUND START', color: 'bg-blue-500', animate: false };
      case 'bidding_locked': return { label: 'BIDDING LOCKED', color: 'bg-orange-500', animate: false };
      case 'question': return { label: 'QUESTION TIME', color: 'bg-purple-500', animate: true };
      case 'scoring': return { label: 'SCORING', color: 'bg-indigo-500', animate: false };
      default: return { label: phase, color: 'bg-slate-500', animate: false };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-3 w-3">
        {config.animate && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.color)}></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-3 w-3", config.color)}></span>
      </span>
      <Badge variant="outline" className="font-display tracking-widest border-white/10 bg-black/20 text-white">
        {config.label}
      </Badge>
    </div>
  );
}
