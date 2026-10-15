import React from 'react';
import { Check, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

interface SkillChipProps {
  name: string;
  category?: string;
  type?: 'matched' | 'missing-required' | 'missing-preferred' | 'related' | 'default';
  evidence?: string;
  relatedTo?: string;
  similarity?: number;
  confidence?: number;
  onRemove?: () => void;
}

export const SkillChip: React.FC<SkillChipProps> = ({
  name,
  category,
  type = 'default',
  evidence,
  relatedTo,
  similarity,
  confidence,
  onRemove,
}) => {
  let styleClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let Icon = null;

  if (type === 'matched') {
    styleClasses = 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:border-emerald-500';
    Icon = Check;
  } else if (type === 'missing-required') {
    styleClasses = 'bg-rose-950/40 text-rose-300 border-rose-500/40';
    Icon = AlertCircle;
  } else if (type === 'missing-preferred') {
    styleClasses = 'bg-amber-950/40 text-amber-300 border-amber-500/40';
  } else if (type === 'related') {
    styleClasses = 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40';
    Icon = Sparkles;
  }

  return (
    <div
      className={`group relative inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${styleClasses}`}
      title={evidence || (relatedTo ? `Related to ${relatedTo} (${Math.round((similarity || 0) * 100)}% match)` : undefined)}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{name}</span>

      {relatedTo && (
        <span className="flex items-center gap-0.5 opacity-80 text-[10px] pl-1 border-l border-cyan-500/30">
          <ArrowRight className="w-2.5 h-2.5" />
          {relatedTo}
        </span>
      )}

      {confidence !== undefined && (
        <span className="text-[10px] opacity-75 font-mono">
          {Math.round(confidence * 100)}%
        </span>
      )}

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 text-slate-400 hover:text-rose-400 focus:outline-none"
        >
          ×
        </button>
      )}
    </div>
  );
};
