import React from 'react';
import { UserStatus } from '../../types';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: UserStatus;
  showStatus?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const STATUS_SIZE_MAP = {
  xs: 'w-2 h-2 ring-1',
  sm: 'w-2.5 h-2.5 ring-1.5',
  md: 'w-3 h-3 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-4 h-4 ring-2',
  '2xl': 'w-5 h-5 ring-3',
};

const STATUS_COLORS: Record<UserStatus, string> = {
  online: 'bg-[#ff6b00]',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
  offline: 'bg-slate-400',
};

function getInitialsColor(name: string): string {
  const colors = [
    'from-[#ff6b00] to-[#e65c00]',
    'from-orange-600 to-amber-700',
    'from-cyan-600 to-blue-700',
    'from-rose-600 to-pink-700',
    'from-indigo-600 to-purple-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  showStatus = false,
  className = '',
}) => {
  const [imageError, setImageError] = React.useState(false);
  const sizeClass = SIZE_MAP[size];
  const statusClass = STATUS_SIZE_MAP[size];

  return (
    <div className={`relative inline-flex flex-shrink-0 select-none ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeClass} rounded-full object-cover shadow-sm ring-2 ring-[#ffffff]`}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full bg-gradient-to-tr ${getInitialsColor(
            name
          )} flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-[#ffffff]`}
        >
          {getInitials(name)}
        </div>
      )}

      {showStatus && status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ${
            STATUS_COLORS[status]
          } ${statusClass} ring-[#ffffff]`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
