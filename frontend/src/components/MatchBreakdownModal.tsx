import React from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, BookOpen, Clock, GraduationCap, FileText, ChevronRight } from 'lucide-react';
import { MatchBreakdown } from '../types';
import { ScoreBadge } from './ScoreBadge';
import { SkillChip } from './SkillChip';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface MatchBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: MatchBreakdown | null;
  jobTitle?: string;
  companyName?: string;
}

export const MatchBreakdownModal: React.FC<MatchBreakdownModalProps> = ({
  isOpen,
  onClose,
  breakdown,
  jobTitle,
  companyName,
}) => {
  if (!isOpen || !breakdown) return null;

  const chartData = [
    { name: 'Semantic Fit', score: Math.round(breakdown.semantic_score), color: '#6366f1' },
    { name: 'Skills Match', score: Math.round(breakdown.skill_score), color: '#10b981' },
    { name: 'Experience', score: Math.round(breakdown.experience_score), color: '#38bdf8' },
    { name: 'Education', score: Math.round(breakdown.education_score), color: '#f59e0b' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl border border-white/10 bg-[#0f172a]/95 shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Explainable Match Intelligence
              </span>
              {breakdown.knockout_applied && (
                <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Knockout Cap Applied
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold font-heading text-white mt-1">
              {jobTitle || 'Role Match Breakdown'}
            </h2>
            {companyName && <p className="text-sm text-slate-400">{companyName}</p>}
          </div>

          <div className="flex items-center gap-4">
            <ScoreBadge score={breakdown.score} size="lg" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Four Component Chart */}
        <div className="my-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Hybrid Scoring Component Distribution
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, 'Score']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explainability Summary */}
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 mb-6">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            Auditable Scoring Explanation
          </div>
          <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed font-sans">
            {breakdown.explanation}
          </div>
        </div>

        {/* Skills Section */}
        <div className="space-y-6">
          {/* Matched Skills */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-2.5">
              <CheckCircle2 className="w-4 h-4" />
              Verified Matched Skills ({breakdown.matched_skills.length})
            </h4>
            {breakdown.matched_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {breakdown.matched_skills.map((s, idx) => (
                  <SkillChip
                    key={idx}
                    name={s.name}
                    type="matched"
                    confidence={s.confidence}
                    evidence={s.evidence}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No direct required skill matches found.</p>
            )}
          </div>

          {/* Missing Required Skills */}
          {breakdown.missing_required.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-400 mb-2.5">
                <AlertTriangle className="w-4 h-4" />
                Missing Required Skills ({breakdown.missing_required.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {breakdown.missing_required.map((s, idx) => (
                  <SkillChip
                    key={idx}
                    name={s.name}
                    type="missing-required"
                    evidence={s.is_mandatory ? 'Mandatory skill! Missing this caps total score at 60.' : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Related / Transferable Skills */}
          {breakdown.related_skills.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-cyan-400 mb-2.5">
                <Sparkles className="w-4 h-4" />
                Transferable Skills (Partial Credit Awarded)
              </h4>
              <div className="flex flex-wrap gap-2">
                {breakdown.related_skills.map((r, idx) => (
                  <SkillChip
                    key={idx}
                    name={r.job_skill}
                    type="related"
                    relatedTo={r.candidate_skill}
                    similarity={r.similarity}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Top Passages Highlight */}
          {breakdown.top_passages && breakdown.top_passages.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                <FileText className="w-4 h-4 text-indigo-400" />
                Top Matching Resume Passages
              </h4>
              <div className="space-y-2.5">
                {breakdown.top_passages.map((chunk, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-400 mb-1">
                      <span>Section: {chunk.section || 'General'}</span>
                      <span className="font-mono">{Math.round(chunk.similarity * 100)}% Semantic Match</span>
                    </div>
                    <p className="line-clamp-3 italic text-slate-400">{chunk.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
