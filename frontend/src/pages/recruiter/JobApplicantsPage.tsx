import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { ScoreBadge } from '../../components/ScoreBadge';
import { SkillChip } from '../../components/SkillChip';
import { MatchBreakdownModal } from '../../components/MatchBreakdownModal';
import {
  Users,
  Filter,
  ArrowLeft,
  Columns,
  Table as TableIcon,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Send
} from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Rejected' },
];

export const JobApplicantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const [minScore, setMinScore] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Selected candidate modal state
  const [activeApplicant, setActiveApplicant] = useState<any | null>(null);
  const [activeResumeText, setActiveResumeText] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [movingStatus, setMovingStatus] = useState(false);

  useEffect(() => {
    fetchJobAndApplicants();
  }, [id, minScore, statusFilter]);

  const fetchJobAndApplicants = async () => {
    setLoading(true);
    try {
      const [jobRes, appsRes] = await Promise.all([
        apiClient.get(`/recruiter/jobs/${id}/`),
        apiClient.get(`/recruiter/jobs/${id}/applicants/?min_score=${minScore}&status=${statusFilter}`),
      ]);
      setJob(jobRes.data);
      setApplicants(appsRes.data.applicants || []);
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApplicant = async (app: any) => {
    setActiveApplicant(app);
    setActiveResumeText(null);
    if (app.resume_id) {
      try {
        const res = await apiClient.get(`/resumes/${app.resume_id}/`);
        setActiveResumeText(res.data.clean_text || res.data.raw_text);
      } catch (err) {
        console.error('Failed to load resume details:', err);
      }
    }
  };

  const handleMoveStatus = async (appId: string, newStatus: string) => {
    setMovingStatus(true);
    try {
      await apiClient.patch(`/recruiter/applications/${appId}/status/`, {
        status: newStatus,
        note: statusNote || `Status moved to ${newStatus}`
      });
      setStatusNote('');
      if (activeApplicant) {
        setActiveApplicant((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }
      fetchJobAndApplicants();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setMovingStatus(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/jobs"
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-heading text-white">
              {job?.title || 'Ranked Applicants'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {job?.company_name} · {applicants.length} Total Evaluated Applicants
            </p>
          </div>
        </div>

        {/* View toggle & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Ranked Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban Pipeline</span>
            </button>
          </div>

          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300"
          >
            <option value="">All Scores</option>
            <option value="80">80%+ (Top Match)</option>
            <option value="65">65%+ (Good Match)</option>
            <option value="50">50%+ (Moderate)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 capitalize"
          >
            <option value="">All Statuses</option>
            {PIPELINE_STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
          Ranking applicants with hybrid scoring algorithm...
        </div>
      ) : applicants.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl space-y-3">
          <Users className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Applicants Yet</h3>
          <p className="text-xs text-slate-400">Candidates applying to this role will appear here automatically ranked by score.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Ranked Table View */
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3.5 px-4">Rank / Score</th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Experience & Degree</th>
                  <th className="py-3.5 px-4">Key Matched Skills</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {applicants.map((app, index) => (
                  <tr
                    key={app.application_id}
                    onClick={() => handleOpenApplicant(app)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 font-bold w-4">#{index + 1}</span>
                        <ScoreBadge score={app.match_score} size="md" />
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-white text-sm">{app.candidate_name}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-xs">{app.headline || app.candidate_email}</div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-300">
                      <div>{app.total_experience_years} Years exp</div>
                      <div className="text-[11px] text-slate-500">{app.highest_education || 'N/A'}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {app.matched_skills?.slice(0, 3).map((s: any, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px]">
                            {s.name}
                          </span>
                        ))}
                        {app.matched_skills?.length > 3 && (
                          <span className="text-[10px] text-slate-500">+{app.matched_skills.length - 3}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="capitalize px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {app.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenApplicant(app);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                      >
                        Inspect Match
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Pipeline Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageApps = applicants.filter(a => a.status === stage.id);
            return (
              <div key={stage.id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 min-w-[200px] flex flex-col h-[70vh]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{stage.label}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                    {stageApps.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {stageApps.map((app) => (
                    <div
                      key={app.application_id}
                      onClick={() => handleOpenApplicant(app)}
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs truncate max-w-[120px]">{app.candidate_name}</span>
                        <ScoreBadge score={app.match_score} size="sm" showLabel={false} />
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{app.headline || `${app.total_experience_years} yrs exp`}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Applicant Detail & Pipeline Action Modal */}
      {activeApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold font-heading text-white">{activeApplicant.candidate_name}</h2>
                  <ScoreBadge score={activeApplicant.match_score} size="md" />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{activeApplicant.candidate_email} · {activeApplicant.headline}</div>
              </div>
              <button
                onClick={() => setActiveApplicant(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Score Breakdown summary */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Semantic</div>
                <div className="text-base font-bold text-indigo-400 mt-0.5">{activeApplicant.breakdown?.semantic_score ?? 0}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Skills</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">{activeApplicant.breakdown?.skill_score ?? 0}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Experience</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">{activeApplicant.breakdown?.experience_score ?? 0}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Education</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">{activeApplicant.breakdown?.education_score ?? 0}%</div>
              </div>
            </div>

            {/* Explainable Reasoning */}
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-300 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Explainable Scoring Rationale
              </div>
              {activeApplicant.explanation}
            </div>

            {/* Pipeline Stage Movement */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Move Stage in Pipeline (Current: <span className="text-indigo-400">{activeApplicant.status}</span>)
              </h3>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.map(s => (
                  <button
                    key={s.id}
                    disabled={movingStatus || activeApplicant.status === s.id}
                    onClick={() => handleMoveStatus(activeApplicant.application_id, s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                      activeApplicant.status === s.id
                        ? 'bg-indigo-600 text-white border-indigo-500 opacity-50 cursor-default'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500 hover:text-white'
                    }`}
                  >
                    Move to {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Extracted Resume Text Preview */}
            {activeResumeText && (
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Candidate Resume Text Preview
                </h3>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed">
                  {activeResumeText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
