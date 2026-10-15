import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';
import { Users, Briefcase, FileText, CheckCircle2, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [matching, setMatching] = useState<any>(null);
  const [skills, setSkills] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminAnalytics();
  }, []);

  const fetchAdminAnalytics = async () => {
    setLoading(true);
    try {
      const [overRes, matchRes, skillRes] = await Promise.all([
        apiClient.get('/admin/analytics/overview/'),
        apiClient.get('/admin/analytics/matching/'),
        apiClient.get('/admin/analytics/skills/'),
      ]);
      setOverview(overRes.data);
      setMatching(matchRes.data);
      setSkills(skillRes.data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const skillGapChartData = skills?.skill_gaps?.slice(0, 10).map((g: any) => ({
    name: g.skill,
    Demand: g.demand,
    Supply: g.supply,
    Deficit: g.deficit,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
          Platform Intelligence & Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          High-level KPIs, machine learning scoring calibration distributions, and skill gap supply vs. demand.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{overview?.users?.total ?? 0}</div>
          <div className="text-[11px] text-slate-500">
            {overview?.users?.candidates ?? 0} Candidates · {overview?.users?.recruiters ?? 0} Recruiters
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Total Jobs</span>
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{overview?.jobs?.total ?? 0}</div>
          <div className="text-[11px] text-emerald-400">{overview?.jobs?.open ?? 0} actively accepting applications</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Resumes Ingested</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{overview?.resumes?.total ?? 0}</div>
          <div className="text-[11px] text-slate-400">Success rate: {overview?.resumes?.success_rate ?? 100}%</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Average Match Score</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{matching?.average_score ?? 0}%</div>
          <div className="text-[11px] text-slate-500">{matching?.total_matches_computed ?? 0} match calculations</div>
        </div>
      </div>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Distribution Histogram */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Match Score Distribution
          </h2>
          <p className="text-xs text-slate-400">
            Calibrated score tiers demonstrating hybrid algorithm spread across candidates.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matching?.distribution || []}>
                <XAxis dataKey="range" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skills Supply vs Demand Gap */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Top Demanded Skills vs Supply Gap
          </h2>
          <p className="text-xs text-slate-400">
            Compares recruiter job requirements against candidate supplied skills.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillGapChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="Demand" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Supply" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
