import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const styles = {
    info: {
      container: 'bg-blue-950/40 border-blue-500/30 text-blue-200',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
      titleColor: 'text-blue-300',
    },
    success: {
      container: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-300',
    },
    warning: {
      container: 'bg-amber-950/40 border-amber-500/30 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-300',
    },
    error: {
      container: 'bg-rose-950/40 border-rose-500/30 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
      titleColor: 'text-rose-300',
    },
  };

  const current = styles[variant];

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border transition-all text-sm',
        current.container,
        className
      )}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h5 className={clsx('font-semibold mb-1', current.titleColor)}>{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
