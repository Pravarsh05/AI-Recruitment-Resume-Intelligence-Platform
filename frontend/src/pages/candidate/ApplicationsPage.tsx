import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Application } from '../../types';
import { Briefcase, Clock, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Ban } from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ results: Application[] } | Application[]>('/applications/mine/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await apiClient.post(`/applications/${id}/withdraw/`);
      await fetchApplications();
    } catch (err) {
      console.error('Failed to withdraw application:', err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
          Application Tracking & History
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your application lifecycle across recruiter screening, technical evaluation, and offer stages.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
          Loading applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl space-y-3">
          <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Submitted Applications</h3>
          <p className="text-xs text-slate-400">
            Browse our open positions to submit your profile and resume.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="glass-panel rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white font-heading">{app.job_title}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {app.company_name} {app.job_location ? `· ${app.job_location}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider capitalize ${
                      app.status === 'hired' || app.status === 'offer'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : app.status === 'rejected' || app.status === 'withdrawn'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {app.status}
                  </span>

                  {app.status !== 'withdrawn' && app.status !== 'rejected' && app.status !== 'hired' && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-rose-500/30 transition-colors"
                      title="Withdraw application"
                    >
                      Withdraw
                    </button>
                  )}

                  <button
                    onClick={() => toggleExpand(app.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {expandedId === app.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {app.cover_note && (
                <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="font-semibold text-slate-400">Cover Note:</span> {app.cover_note}
                </div>
              )}

              {/* Status Timeline History */}
              {expandedId === app.id && app.history && app.history.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Pipeline Status Timeline
                  </h4>
                  <div className="space-y-2.5 pl-2 border-l border-slate-800 ml-2">
                    {app.history.map((hist) => (
                      <div key={hist.id} className="relative pl-4 text-xs">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                        <div className="flex items-center justify-between text-slate-200">
                          <span className="font-semibold capitalize">{hist.from_status} → {hist.to_status}</span>
                          <span className="text-[10px] text-slate-500">{new Date(hist.changed_at).toLocaleString()}</span>
                        </div>
                        {hist.note && <p className="text-slate-400 text-[11px] mt-0.5">{hist.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
