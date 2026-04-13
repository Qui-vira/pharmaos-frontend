'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
  glowColor,
  onClick,
}: GlassCardProps) {
  const Component = hover ? motion.div : 'div';
  const hoverProps = hover
    ? {
        whileHover: { scale: 1.02, y: -4 },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <Component
      className={cn(
        'glass-card',
        hover && 'cursor-pointer transition-shadow',
        glow && 'glow-brand',
        className,
      )}
      style={glowColor ? { boxShadow: `0 0 20px ${glowColor}` } : undefined}
      onClick={onClick}
      {...hoverProps}
    >
      {children}
    </Component>
  );
}
