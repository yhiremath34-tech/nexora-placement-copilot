import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all duration-200 border text-slate-100';

  const variantStyles = {
    default: 'bg-[#0e1526] border-slate-800/80 shadow-md',
    elevated: 'bg-[#151f38] border-slate-700/60 shadow-xl shadow-black/40',
    glass: 'bg-[#0e1526]/70 backdrop-blur-md border-white/[0.08] shadow-lg',
    interactive:
      'bg-[#0e1526] hover:bg-[#121c33] border-slate-800 hover:border-blue-500/40 cursor-pointer shadow-md hover:shadow-blue-500/10 hover:-translate-y-0.5',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], paddingStyles[padding], className))}
      {...props}
    >
      {children}
    </div>
  );
};
