import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Briefcase, Users, TrendingUp, CheckCircle, PlusCircle, ArrowRight, Clock } from 'lucide-react';
import { ScoreBadge } from '../../components/ScoreBadge';

export const RecruiterDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recruiter/dashboard/');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch recruiter dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block mb-2">
              Recruiter Intelligence Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
              Talent Pipeline & Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Monitor active roles, track pipeline throughput, and review AI-ranked candidates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/recruiter/jobs"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-medium border border-slate-700 transition-colors"
            >
              Manage Jobs
            </Link>
            <Link
              to="/recruiter/jobs/new"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Post New Job
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Open Positions</div>
          <div className="text-2xl font-bold text-white">{data?.open_jobs ?? 0}</div>
          <div className="text-[11px] text-slate-500">of {data?.total_jobs ?? 0} total postings</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Total Applicants</div>
          <div className="text-2xl font-bold text-cyan-400">{data?.total_applicants ?? 0}</div>
          <div className="text-[11px] text-slate-500">Across all active roles</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Avg Match Score</div>
          <div className="text-2xl font-bold text-emerald-400">{data?.average_match_score ?? 0}%</div>
          <div className="text-[11px] text-slate-500">Four-component calibrated</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Shortlisted & Offer</div>
          <div className="text-2xl font-bold text-indigo-400">
            {data?.funnel?.filter((f: any) => ['shortlisted', 'interview', 'offer', 'hired'].includes(f.status)).reduce((a: number, c: any) => a + c.count, 0) ?? 0}
          </div>
          <div className="text-[11px] text-slate-500">Qualified candidates</div>
        </div>
      </div>

      {/* Pipeline Funnel Stages */}
      {data?.funnel && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold font-heading text-white">Pipeline Throughput Funnel</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {data.funnel.map((stage: any) => (
              <div key={stage.status} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-lg font-bold text-indigo-400">{stage.count}</div>
                <div className="text-[11px] font-semibold text-slate-300 capitalize mt-0.5 truncate">{stage.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Applications */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Recent Candidate Applications
          </h2>
          <Link to="/recruiter/jobs" className="text-xs font-semibold text-indigo-400 hover:underline">
            View Job Applicants
          </Link>
        </div>

        {data?.recent_applications && data.recent_applications.length > 0 ? (
          <div className="space-y-3">
            {data.recent_applications.map((app: any) => (
              <div key={app.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-sm">{app.candidate_name}</div>
                  <div className="text-xs text-slate-400">{app.job_title}</div>
                </div>

                <div className="flex items-center gap-4">
                  {app.score !== null && <ScoreBadge score={app.score} size="sm" />}
                  <span className="text-xs uppercase font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No applications received yet.</p>
        )}
      </div>
    </div>
  );
};
