import React from 'react';
import { clsx } from 'clsx';

export interface ProgressBarProps {
  value: number; // 0 - 100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'emerald' | 'amber' | 'purple';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  size = 'md',
  color = 'blue',
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-600 to-cyan-500',
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-400',
    amber: 'bg-gradient-to-r from-amber-600 to-yellow-400',
    purple: 'bg-gradient-to-r from-purple-600 to-indigo-400',
  };

  return (
    <div className={clsx('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          {label && <span className="font-medium text-slate-300">{label}</span>}
          {showPercentage && (
            <span className="font-semibold text-slate-400 font-mono">{clampedValue}%</span>
          )}
        </div>
      )}
      <div className={clsx('w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50', sizeClasses[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out', colorClasses[color])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
