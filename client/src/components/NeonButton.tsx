import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const baseStyles = "relative font-display font-bold uppercase tracking-widest transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform active:scale-95";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] border border-transparent",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-transparent",
      danger: "bg-destructive text-white hover:bg-destructive/90 shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-transparent",
      outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary/10 shadow-[0_0_10px_rgba(250,204,21,0.1)] hover:shadow-[0_0_15px_rgba(250,204,21,0.2)]"
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
      xl: "px-10 py-5 text-xl w-full"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin inline-block" />}
        {children}
        
        {/* Decorative corner accents for tech feel */}
        {variant !== 'outline' && (
          <>
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/30" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/30" />
          </>
        )}
      </button>
    );
  }
);

NeonButton.displayName = "NeonButton";
