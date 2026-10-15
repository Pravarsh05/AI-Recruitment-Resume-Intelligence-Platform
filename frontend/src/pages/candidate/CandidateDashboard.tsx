import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Job, Application, MatchBreakdown } from '../../types';
import { ScoreBadge } from '../../components/ScoreBadge';
import { MatchBreakdownModal } from '../../components/MatchBreakdownModal';
import {
  FileText,
  Briefcase,
  TrendingUp,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Compass
} from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<MatchBreakdown | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        apiClient.get('/jobs/recommended/'),
        apiClient.get('/applications/mine/'),
      ]);
      setRecommendedJobs(jobsRes.data.results || []);
      setApplications(appsRes.data.results || appsRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openMatchModal = async (job: Job) => {
    setSelectedJob(job);
    try {
      const res = await apiClient.get<MatchBreakdown>(`/jobs/${job.id}/match/`);
      setSelectedBreakdown(res.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch match breakdown:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Candidate Intelligence Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
              Career Dashboard & Match Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Track your tailored job matches, monitor active recruitment pipelines, and optimize your skill profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/candidate/resume"
              className="px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              Manage Resume
            </Link>
            <Link
              to="/candidate/jobs"
              className="px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Explore All Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Recommended Jobs & Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended Jobs (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Top Ranked Job Recommendations
            </h2>
            <Link to="/candidate/jobs" className="text-xs font-semibold text-indigo-400 hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 glass-panel rounded-2xl">
              Analyzing vectors & computing match scores...
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-base font-semibold text-white">No Recommendations Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Upload and embed your resume to let our hybrid AI engine match your skills against active roles.
              </p>
              <Link
                to="/candidate/resume"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Upload Resume Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  onClick={() => openMatchModal(job)}
                  className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-base hover:text-indigo-400 transition-colors">
                        {job.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        {job.work_mode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {job.company_name} {job.location ? `· ${job.location}` : ''} · {job.min_experience_years}+ yrs exp
                    </div>
                    {job.explanation_summary && (
                      <p className="text-xs text-slate-400 line-clamp-1 italic mt-1">
                        {job.explanation_summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {job.match_score !== undefined && (
                      <ScoreBadge score={job.match_score} size="md" />
                    )}
                    <button className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Active Applications & Skills Insights */}
        <div className="space-y-6">
          {/* Active Applications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                Active Applications
              </h2>
              <Link to="/candidate/applications" className="text-xs font-semibold text-indigo-400 hover:underline">
                History
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="glass-panel p-6 rounded-2xl text-center text-xs text-slate-400">
                You haven't submitted any applications yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {applications.slice(0, 4).map((app) => (
                  <div key={app.id} className="p-3.5 rounded-xl glass-panel border border-white/5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>{app.job_title}</span>
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {app.status}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1 flex items-center justify-between">
                      <span>{app.company_name}</span>
                      <span className="flex items-center gap-1 text-[11px] opacity-75">
                        <Clock className="w-3 h-3" />
                        {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Skill Optimization Card */}
          <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-slate-900/60">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Skill Intelligence Tip
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Employers matching your background frequently require <span className="text-indigo-300 font-semibold">Docker, CI/CD, and PostgreSQL</span>. Ensure your verified skills list reflects your latest hands-on projects to maximize match scores.
            </p>
            <div className="mt-4">
              <Link
                to="/candidate/resume"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                Review Verified Skills <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Match Breakdown Modal */}
      <MatchBreakdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        breakdown={selectedBreakdown}
        jobTitle={selectedJob?.title}
        companyName={selectedJob?.company_name}
      />
    </div>
  );
};
