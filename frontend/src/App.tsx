import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { ResumeUploadPage } from './pages/candidate/ResumeUploadPage';
import { JobBrowsePage } from './pages/candidate/JobBrowsePage';
import { ApplicationsPage } from './pages/candidate/ApplicationsPage';
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { RecruiterJobsPage } from './pages/recruiter/RecruiterJobsPage';
import { JobEditorPage } from './pages/recruiter/JobEditorPage';
import { JobApplicantsPage } from './pages/recruiter/JobApplicantsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSkillsPage } from './pages/admin/AdminSkillsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

interface RequireRoleProps {
  role: 'candidate' | 'recruiter' | 'admin';
  children: React.ReactNode;
}

const RequireRole: React.FC<RequireRoleProps> = ({ role, children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role && user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel rounded-2xl text-center space-y-3">
        <h2 className="text-xl font-bold text-rose-400">Access Restricted</h2>
        <p className="text-xs text-slate-400">
          This area is designated for {role} accounts. Your account role is {user.role}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Candidate Routes */}
          <Route
            path="/candidate/dashboard"
            element={
              <RequireRole role="candidate">
                <CandidateDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/candidate/resume"
            element={
              <RequireRole role="candidate">
                <ResumeUploadPage />
              </RequireRole>
            }
          />
          <Route
            path="/candidate/jobs"
            element={
              <RequireRole role="candidate">
                <JobBrowsePage />
              </RequireRole>
            }
          />
          <Route
            path="/candidate/applications"
            element={
              <RequireRole role="candidate">
                <ApplicationsPage />
              </RequireRole>
            }
          />

          {/* Recruiter Routes */}
          <Route
            path="/recruiter/dashboard"
            element={
              <RequireRole role="recruiter">
                <RecruiterDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <RequireRole role="recruiter">
                <RecruiterJobsPage />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/jobs/new"
            element={
              <RequireRole role="recruiter">
                <JobEditorPage />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/jobs/:id/edit"
            element={
              <RequireRole role="recruiter">
                <JobEditorPage />
              </RequireRole>
            }
          />
          <Route
            path="/recruiter/jobs/:id/applicants"
            element={
              <RequireRole role="recruiter">
                <JobApplicantsPage />
              </RequireRole>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/analytics"
            element={
              <RequireRole role="admin">
                <AdminAnalyticsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/skills"
            element={
              <RequireRole role="admin">
                <AdminSkillsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole role="admin">
                <AdminUsersPage />
              </RequireRole>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RecruitAI © 2026. Explainable AI Recruitment & Resume Intelligence Platform.</span>
          <span className="font-mono text-slate-600">Algorithm Version: v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};
