import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  FileCheck,
  Cpu,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Briefcase,
  Layers,
  BarChart3
} from 'lucide-react';
import { ScoreBadge } from '../components/ScoreBadge';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Hybrid Matching & Resume Intelligence Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-heading text-white max-w-4xl mx-auto leading-tight">
          Recruitment Intelligence Powered by <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">Explainable AI</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Move beyond black-box keyword filtering. Automatically extract structured skills, rank applicants with auditable four-component scoring, and uncover actionable skill gaps.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-xl shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>Get Started for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-slate-200 glass-panel glass-panel-hover border border-white/10 hover:text-white transition-all flex items-center justify-center"
          >
            Explore Live Demo
          </Link>
        </div>

        {/* Interactive Match Visual Preview */}
        <div className="mt-16 max-w-3xl mx-auto glass-panel rounded-2xl p-6 sm:p-8 text-left border border-white/10 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="text-xs uppercase font-semibold text-indigo-400 tracking-wider">Interactive Scoring Sample</div>
              <h3 className="text-xl font-bold text-white mt-0.5">Senior Full Stack Engineer</h3>
              <p className="text-xs text-slate-400">CloudScale Tech · Hybrid · 4+ Years Experience</p>
            </div>
            <ScoreBadge score={84} size="lg" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Semantic Fit</div>
              <div className="text-lg font-bold text-indigo-400 mt-0.5">85%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Skill Overlap</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">92%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Experience Fit</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">100%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Education</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">100%</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-indigo-300">Auditable AI Explanation:</span> Strong match (84/100). Candidate presents 5.2 years of verified experience exceeding the 4.0-year minimum. Direct matches found for Python, React, PostgreSQL, and Docker.
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold font-heading text-white">Engineered for Transparency & Precision</h2>
            <p className="mt-3 text-slate-400">Everything needed to streamline hiring pipelines and empower candidates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl glass-panel glass-panel-hover border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Automated Resume Ingestion</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Asynchronous PDF extraction with column layout preservation and OCR fallback. Parses experience intervals, degrees, and contact details in seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel glass-panel-hover border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Explainable Hybrid Scoring</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Combines sentence transformer embeddings (pgvector) with deterministic rule-based skill verification and knockout caps for mandatory skills.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel glass-panel-hover border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Recruiter Kanban & Analytics</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Manage applicants across custom pipeline stages, view skills supply vs. demand market analytics, and track hiring velocity in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
