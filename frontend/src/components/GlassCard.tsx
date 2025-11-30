import { ReactNode, HTMLAttributes, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import anime from 'animejs';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  hover = false, 
  glow = false,
  gradient = false,
  onClick,
  ...props 
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (hover && cardRef.current) {
      anime({
        targets: cardRef.current,
        translateY: -4,
        duration: 250,
        easing: 'easeOutCubic'
      });
    }
  };

  const handleMouseLeave = () => {
    if (hover && cardRef.current) {
      anime({
        targets: cardRef.current,
        translateY: 0,
        duration: 250,
        easing: 'easeOutCubic'
      });
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-xl transition-all duration-300',
        hover && 'cursor-pointer hover:border-[#00FF41]/30 hover:bg-white/[0.04]',
        gradient && 'before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:bg-gradient-to-br before:from-[#00F2FF]/20 before:to-[#00FF41]/20 before:-z-10',
        glow && 'shadow-[0_0_30px_rgba(0,242,255,0.15)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
