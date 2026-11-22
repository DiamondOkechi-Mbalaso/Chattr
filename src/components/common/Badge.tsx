import React from 'react';

interface BadgeProps {
  count?: number;
  text?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  text,
  variant = 'primary',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-indigo-600 text-white',
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-600 text-white',
    danger: 'bg-rose-600 text-white',
    neutral: 'bg-slate-700 text-slate-200',
  };

  const displayText = count !== undefined ? (count > 99 ? '99+' : count.toString()) : text;

  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full min-w-[20px] h-5 shadow-sm ${variantStyles[variant]} ${className}`}
    >
      {displayText}
    </span>
  );
};
