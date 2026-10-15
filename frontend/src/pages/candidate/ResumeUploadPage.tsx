import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { Resume, CandidateSkill } from '../../types';
import { SkillChip } from '../../components/SkillChip';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Star,
  Plus,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const ResumeUploadPage: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [skills, setSkills] = useState<CandidateSkill[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResumes();
    fetchCandidateSkills();
  }, []);

  // Poll status every 2 seconds while resume status is not embedded/failed
  useEffect(() => {
    if (!pollingId) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get<Resume>(`/resumes/${pollingId}/`);
        const updated = res.data;
        setActiveResume(updated);
        setResumes(prev => prev.map(r => r.id === updated.id ? updated : r));

        if (updated.status === 'embedded' || updated.status === 'failed') {
          setPollingId(null);
          fetchCandidateSkills(); // Refresh skills when done
        }
      } catch (err) {
        console.error('Polling failed:', err);
        setPollingId(null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingId]);

  const fetchResumes = async () => {
    try {
      const res = await apiClient.get<Resume[]>('/resumes/');
      setResumes(res.data);
      const primary = res.data.find(r => r.is_primary) || res.data[0];
      if (primary) {
        fetchResumeDetails(primary.id);
      }
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    }
  };

  const fetchResumeDetails = async (id: string) => {
    try {
      const res = await apiClient.get<Resume>(`/resumes/${id}/`);
      setActiveResume(res.data);
      if (res.data.status !== 'embedded' && res.data.status !== 'failed') {
        setPollingId(res.data.id);
      }
    } catch (err) {
      console.error('Failed to get resume details:', err);
    }
  };

  const fetchCandidateSkills = async () => {
    try {
      const res = await apiClient.get<{ results: CandidateSkill[] } | CandidateSkill[]>('/me/skills/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setSkills(data);
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a standard PDF resume document.');
      return;
    }
    setErrorMsg(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/resumes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const resumeId = res.data.resume_id;
      setPollingId(resumeId);
      await fetchResumes();
      await fetchResumeDetails(resumeId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to upload PDF.');
    } finally {
      setUploading(false);
    }
  };

  const setPrimary = async (id: string) => {
    try {
      await apiClient.post(`/resumes/${id}/set-primary/`);
      await fetchResumes();
    } catch (err) {
      console.error('Failed to set primary resume:', err);
    }
  };

  const deleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this resume?')) return;
    try {
      await apiClient.delete(`/resumes/${id}/`);
      await fetchResumes();
      if (activeResume?.id === id) {
        setActiveResume(null);
      }
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      await apiClient.post('/me/skills/', { name: newSkillName.trim(), confidence: 1.0, is_confirmed: true });
      setNewSkillName('');
      fetchCandidateSkills();
    } catch (err) {
      console.error('Failed to add skill:', err);
    }
  };

  const handleToggleConfirmSkill = async (skill: CandidateSkill) => {
    try {
      await apiClient.patch(`/me/skills/${skill.id}/`, { is_confirmed: !skill.is_confirmed });
      fetchCandidateSkills();
    } catch (err) {
      console.error('Failed to update skill confirmation:', err);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await apiClient.delete(`/me/skills/${id}/`);
      fetchCandidateSkills();
    } catch (err) {
      console.error('Failed to delete skill:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
          Resume Intelligence & Profile Extraction
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload your resume in PDF format to parse structured entities, generate unit-normalized vector embeddings, and calibrate matching accuracy.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className="glass-panel border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-slate-900/60 group"
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-white">
          {uploading ? 'Uploading & initializing extraction...' : 'Drag and drop your PDF resume here'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          PDF only (Max 5 MB). Multi-column, modern, and scanned formats supported via OCR fallback.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Resume Extraction Status & Details */}
        <div className="lg:col-span-2 space-y-6">
          {activeResume ? (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-xl font-bold text-white">{activeResume.original_filename}</h2>
                    {activeResume.is_primary && (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Primary Resume
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Uploaded on {new Date(activeResume.uploaded_at).toLocaleString()} · {(activeResume.file_size / 1024).toFixed(1)} KB
                  </div>
                </div>

                {/* Pipeline Status Pill */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 ${
                      activeResume.status === 'embedded'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : activeResume.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {activeResume.status === 'embedded' && <CheckCircle className="w-3.5 h-3.5" />}
                    {activeResume.status === 'failed' && <AlertCircle className="w-3.5 h-3.5" />}
                    {['uploaded', 'extracting', 'extracted', 'parsing'].includes(activeResume.status) && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>{activeResume.status}</span>
                  </span>
                </div>
              </div>

              {/* Parsed Profile Data Summary */}
              {activeResume.parsed_data && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Experience</div>
                    <div className="text-base font-bold text-indigo-300 mt-1">
                      {activeResume.parsed_data.total_experience_years || 0} Years
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Highest Education</div>
                    <div className="text-base font-bold text-cyan-300 mt-1">
                      {activeResume.parsed_data.education?.highest_degree_name || 'Not detected'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Skills Extracted</div>
                    <div className="text-base font-bold text-emerald-300 mt-1">
                      {activeResume.parsed_data.skills?.length || 0} Skills
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Sections Preview */}
              {activeResume.sections && Object.keys(activeResume.sections).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Identified Resume Sections ({Object.keys(activeResume.sections).length})
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(activeResume.sections).map(([secName, secText]) => (
                      <div key={secName} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                        <div className="font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                          {secName}
                        </div>
                        <p className="text-slate-300 whitespace-pre-line line-clamp-4 leading-relaxed font-sans">
                          {secText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-sm">
              Select or upload a resume to inspect extracted sections and intelligence data.
            </div>
          )}
        </div>

        {/* Right Col: Verified Candidate Skills & Previously Uploaded List */}
        <div className="space-y-6">
          {/* Verified Skills Manager */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Verified Candidate Skills ({skills.length})
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Extracted from your resume. You can verify, add, or remove skills below to update your match scores.
            </p>

            {/* Add Skill Form */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Add skill (e.g. GraphQL, AWS)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            {/* Skill Chips */}
            <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pt-1">
              {skills.map((s) => (
                <div key={s.id} onClick={() => handleToggleConfirmSkill(s)} className="cursor-pointer">
                  <SkillChip
                    name={s.skill_name}
                    confidence={s.confidence}
                    type={s.is_confirmed ? 'matched' : 'default'}
                    evidence={s.evidence}
                    onRemove={() => handleDeleteSkill(s.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Previous Resumes List */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold font-heading text-white">Your Resumes ({resumes.length})</h3>
            <div className="space-y-2.5">
              {resumes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => fetchResumeDetails(r.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    activeResume?.id === r.id
                      ? 'bg-indigo-950/30 border-indigo-500/50 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="font-semibold truncate">{r.original_filename}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{r.status}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!r.is_primary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimary(r.id);
                        }}
                        title="Set as Primary Resume"
                        className="p-1 rounded text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteResume(r.id);
                      }}
                      title="Delete Resume"
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
