import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Job } from '../../types';
import { Briefcase, Users, PlusCircle, ExternalLink, Edit3, Trash2 } from 'lucide-react';

export const RecruiterJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ results: Job[] } | Job[]>('/recruiter/jobs/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch recruiter jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await apiClient.delete(`/recruiter/jobs/${id}/`);
      fetchJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
            Job Postings & Pipelines
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your open postings and inspect AI-ranked candidate applicant pools.
          </p>
        </div>

        <Link
          to="/recruiter/jobs/new"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Job
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
          Loading your job listings...
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl space-y-3">
          <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Jobs Posted Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first position to begin receiving and scoring candidate resumes automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold font-heading text-white">{job.title}</h3>
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                      job.status === 'open'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {job.company_name} · {job.location || 'Remote'} · {job.min_experience_years}+ yrs exp
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                  <Users className="w-4 h-4" />
                  <span>{job.applicants_count || 0} Applicants</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/recruiter/jobs/${job.id}/applicants`}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1"
                  >
                    <span>Ranked Applicants</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to={`/recruiter/jobs/${job.id}/edit`}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Edit job"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
