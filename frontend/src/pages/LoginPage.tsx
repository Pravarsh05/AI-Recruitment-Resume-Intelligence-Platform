import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, User, Briefcase, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else if (user.role === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/analytics');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Invalid email or password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 sm:p-10 rounded-2xl border border-white/10 shadow-2xl relative">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-white">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-1">Sign in to your RecruitAI account</p>
        </div>

        {/* Quick Demo Acccount Switchers */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
            One-Click Demo Profiles
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('candidate@recruitai.com')}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-slate-700/60 transition-all text-xs font-medium text-slate-200"
            >
              <User className="w-4 h-4 text-cyan-400 mb-1" />
              <span>Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('recruiter@recruitai.com')}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-slate-700/60 transition-all text-xs font-medium text-slate-200"
            >
              <Briefcase className="w-4 h-4 text-indigo-400 mb-1" />
              <span>Recruiter</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@recruitai.com')}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-slate-700/60 transition-all text-xs font-medium text-slate-200"
            >
              <Shield className="w-4 h-4 text-emerald-400 mb-1" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
