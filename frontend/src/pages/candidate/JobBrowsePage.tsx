import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Job, MatchBreakdown } from '../../types';
import { ScoreBadge } from '../../components/ScoreBadge';
import { SkillChip } from '../../components/SkillChip';
import { MatchBreakdownModal } from '../../components/MatchBreakdownModal';
import {
  Search,
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  Filter,
  CheckCircle2,
  DollarSign,
  ArrowRight
} from 'lucide-react';

export const JobBrowsePage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [workMode, setWorkMode] = useState<string>('');
  const [maxExp, setMaxExp] = useState<string>('');

  // Modal & apply states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [breakdown, setBreakdown] = useState<MatchBreakdown | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [workMode, maxExp]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (workMode) params.append('work_mode', workMode);
      if (maxExp) params.append('max_experience', maxExp);

      const res = await apiClient.get<{ results: Job[] } | Job[]>(`/jobs/?${params.toString()}`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleViewBreakdown = async (job: Job) => {
    setSelectedJob(job);
    try {
      const res = await apiClient.get<MatchBreakdown>(`/jobs/${job.id}/match/`);
      setBreakdown(res.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to get match breakdown:', err);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalJob) return;

    setApplying(true);
    try {
      await apiClient.post(`/jobs/${applyModalJob.id}/apply/`, { cover_note: coverNote });
      setApplySuccessMsg(`Application for ${applyModalJob.title} submitted successfully!`);
      setCoverNote('');
      setTimeout(() => {
        setApplyModalJob(null);
        setApplySuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to submit application.';
      alert(msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
          Explore Open Opportunities
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse verified job postings with instant hybrid match scores and missing skill gap analysis.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, company, or keywords (e.g. Python, React)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Work Modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>

            <select
              value={maxExp}
              onChange={(e) => setMaxExp(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Experience Level</option>
              <option value="2">0 - 2 Years</option>
              <option value="5">Up to 5 Years</option>
              <option value="8">Up to 8 Years</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
          Loading matching opportunities...
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
          No matching jobs found. Try adjusting your search query or filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="glass-panel glass-panel-hover p-6 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-white font-heading">{job.title}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">{job.company_name}</div>
                  </div>
                  {job.match_preview ? (
                    <ScoreBadge score={job.match_preview.score} size="md" />
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                      Open Role
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {job.location || 'Remote'} ({job.work_mode})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {job.min_experience_years}+ yrs exp
                  </span>
                  {job.salary_min && (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <DollarSign className="w-3.5 h-3.5" />
                      ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max! / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                {/* Skills tags */}
                {job.job_skills && job.job_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.job_skills.slice(0, 6).map((js, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium border ${
                          js.requirement === 'required'
                            ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {js.skill_name || js.name}
                        {js.is_mandatory && ' *'}
                      </span>
                    ))}
                    {job.job_skills.length > 6 && (
                      <span className="text-[11px] text-slate-500 self-center">
                        +{job.job_skills.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleViewBreakdown(job)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Score Breakdown
                </button>

                <button
                  onClick={() => setApplyModalJob(job)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match Breakdown Modal */}
      <MatchBreakdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        breakdown={breakdown}
        jobTitle={selectedJob?.title}
        companyName={selectedJob?.company_name}
      />

      {/* Apply Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white font-heading">
              Apply to {applyModalJob.title}
            </h3>
            <p className="text-xs text-slate-400">
              {applyModalJob.company_name} will receive your primary verified resume and profile.
            </p>

            {applySuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{applySuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Cover Note (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Highlight your key achievements or why you are excited for this role..."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalJob(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
