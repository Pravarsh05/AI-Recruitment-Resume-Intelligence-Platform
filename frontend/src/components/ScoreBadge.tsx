import React from 'react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = 'md', showLabel = true }) => {
  const rounded = Math.round(score);

  let colorClasses = 'from-emerald-500 to-teal-400 text-emerald-100 border-emerald-500/30';
  let badgeText = 'Exceptional';

  if (rounded < 50) {
    colorClasses = 'from-rose-500 to-red-500 text-rose-100 border-rose-500/30';
    badgeText = 'Low Match';
  } else if (rounded < 70) {
    colorClasses = 'from-amber-500 to-yellow-400 text-amber-100 border-amber-500/30';
    badgeText = 'Moderate';
  } else if (rounded < 85) {
    colorClasses = 'from-indigo-500 to-cyan-400 text-indigo-100 border-indigo-500/30';
    badgeText = 'Strong Match';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-gradient-to-r shadow-sm ${colorClasses} ${sizeClasses}`}>
      <span className="font-extrabold">{rounded}%</span>
      {showLabel && <span className="opacity-90 font-medium">· {badgeText}</span>}
    </div>
  );
};
