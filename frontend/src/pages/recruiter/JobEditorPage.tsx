import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Job, JobSkill } from '../../types';
import { Sparkles, Plus, Trash2, ArrowLeft, Check, AlertCircle } from 'lucide-react';

export const JobEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<'remote' | 'hybrid' | 'onsite'>('remote');
  const [employmentType, setEmploymentType] = useState<'full_time' | 'part_time' | 'contract' | 'internship'>('full_time');
  const [minExp, setMinExp] = useState(2.0);
  const [educationRequired, setEducationRequired] = useState('Bachelor');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [status, setStatus] = useState<'draft' | 'open' | 'closed'>('open');

  const [skills, setSkills] = useState<JobSkill[]>([]);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customReq, setCustomReq] = useState<'required' | 'preferred'>('required');
  const [customMandatory, setCustomMandatory] = useState(false);

  const [extractingSkills, setExtractingSkills] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const res = await apiClient.get<Job>(`/recruiter/jobs/${id}/`);
      const j = res.data;
      setTitle(j.title);
      setCompanyName(j.company_name);
      setDescription(j.description);
      setLocation(j.location || '');
      setWorkMode(j.work_mode);
      setEmploymentType(j.employment_type);
      setMinExp(j.min_experience_years);
      setEducationRequired(j.education_required || '');
      setSalaryMin(j.salary_min || '');
      setSalaryMax(j.salary_max || '');
      setStatus(j.status);
      setSkills(j.job_skills || []);
    } catch (err) {
      console.error('Failed to load job details:', err);
    }
  };

  const handleSuggestSkills = async () => {
    if (!description.trim()) {
      alert('Please provide a job description first so AI can extract relevant skills.');
      return;
    }

    setExtractingSkills(true);
    try {
      const res = await apiClient.post('/recruiter/jobs/extract-skills/', { description });
      const { recommended_required, recommended_preferred } = res.data;

      const newSkills: JobSkill[] = [];
      const seen = new Set(skills.map(s => (s.skill_name || s.name || '').toLowerCase()));

      for (const item of recommended_required) {
        if (!seen.has(item.name.toLowerCase())) {
          newSkills.push({
            name: item.name,
            requirement: 'required',
            weight: 2.0,
            is_mandatory: false,
          });
          seen.add(item.name.toLowerCase());
        }
      }

      for (const item of recommended_preferred) {
        if (!seen.has(item.name.toLowerCase())) {
          newSkills.push({
            name: item.name,
            requirement: 'preferred',
            weight: 1.0,
            is_mandatory: false,
          });
          seen.add(item.name.toLowerCase());
        }
      }

      setSkills(prev => [...prev, ...newSkills]);
    } catch (err) {
      console.error('Skill extraction failed:', err);
    } finally {
      setExtractingSkills(false);
    }
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillName.trim()) return;

    setSkills(prev => [
      ...prev,
      {
        name: customSkillName.trim(),
        requirement: customReq,
        weight: customReq === 'required' ? 2.0 : 1.0,
        is_mandatory: customMandatory,
      }
    ]);
    setCustomSkillName('');
    setCustomMandatory(false);
  };

  const removeSkill = (index: number) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSkillMandatory = (index: number) => {
    setSkills(prev => prev.map((s, i) => i === index ? { ...s, is_mandatory: !s.is_mandatory } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      company_name: companyName,
      description,
      location,
      work_mode: workMode,
      employment_type: employmentType,
      min_experience_years: Number(minExp),
      education_required: educationRequired,
      salary_min: salaryMin === '' ? null : Number(salaryMin),
      salary_max: salaryMax === '' ? null : Number(salaryMax),
      status,
      job_skills: skills.map(s => ({
        name: s.skill_name || s.name,
        requirement: s.requirement,
        weight: s.weight,
        is_mandatory: s.is_mandatory,
      }))
    };

    try {
      if (isEdit) {
        await apiClient.patch(`/recruiter/jobs/${id}/`, payload);
      } else {
        await apiClient.post('/recruiter/jobs/', payload);
      }
      navigate('/recruiter/jobs');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save job posting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/recruiter/jobs')}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">
            {isEdit ? 'Edit Job Posting' : 'Create New Job Posting'}
          </h1>
          <p className="text-xs text-slate-400">Configure position details and structured requirement skills</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. TechCorp"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Job Description *
              </label>
              <button
                type="button"
                onClick={handleSuggestSkills}
                disabled={extractingSkills}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {extractingSkills ? 'Extracting skills...' : 'Suggest Skills with AI'}
              </button>
            </div>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline responsibilities, tech stack, and ideal background..."
              className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={(e: any) => setWorkMode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Min Experience (Yrs)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={minExp}
                onChange={(e) => setMinExp(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Education Level</label>
              <select
                value={educationRequired}
                onChange={(e) => setEducationRequired(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">None / Flexible</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
                <option value="Doctorate">Doctorate (PhD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="open">Open (Active)</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Structured Skills Section */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-white">Target Skills & Knockout Requirements</h3>
            <span className="text-xs text-slate-400">Total Skills: {skills.length}</span>
          </div>

          {/* Add skill input row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customSkillName}
              onChange={(e) => setCustomSkillName(e.target.value)}
              placeholder="Skill name (e.g. PyTorch, Docker, React)"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={customReq}
              onChange={(e: any) => setCustomReq(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            >
              <option value="required">Required (2x weight)</option>
              <option value="preferred">Preferred (1x weight)</option>
            </select>
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={customMandatory}
                onChange={(e) => setCustomMandatory(e.target.checked)}
                className="rounded bg-slate-800 text-indigo-600 focus:ring-0"
              />
              <span>Mandatory *</span>
            </label>
            <button
              type="button"
              onClick={handleAddCustomSkill}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {/* Skills List */}
          <div className="space-y-2 pt-2">
            {skills.map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{s.skill_name || s.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      s.requirement === 'required'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.requirement}
                  </span>
                  {s.is_mandatory && (
                    <span className="text-rose-400 font-bold text-[11px]" title="Mandatory Knockout">
                      ★ Mandatory
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSkillMandatory(idx)}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                      s.is_mandatory
                        ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {s.is_mandatory ? 'Knockout Active' : 'Set as Mandatory'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/recruiter/jobs')}
            className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Job Posting' : 'Publish Job'}
          </button>
        </div>
      </form>
    </div>
  );
};
