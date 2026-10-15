export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  email_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  message?: string;
}

export interface CandidateSkill {
  id: string;
  skill_id?: string;
  skill_name: string;
  category: string;
  confidence: number;
  years?: number;
  evidence?: string;
  is_confirmed: boolean;
}

export interface CandidateProfile {
  id: string;
  full_name: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  total_experience_years: number;
  highest_education: string;
  open_to_work: boolean;
  primary_resume_id?: string;
  educations?: any[];
  experiences?: any[];
}

export interface Resume {
  id: string;
  original_filename: string;
  file_size: number;
  status: 'uploaded' | 'extracting' | 'extracted' | 'parsing' | 'embedded' | 'failed';
  failure_reason?: string;
  raw_text?: string;
  clean_text?: string;
  sections?: Record<string, string>;
  parsed_data?: {
    skills?: Array<{ name: string; category: string; confidence: number; evidence?: string }>;
    total_experience_years?: number;
    education?: { highest_degree_name: string; highest_degree_level: number };
    contact_info?: { email?: string; phone?: string; linkedin?: string; github?: string };
    is_ocr?: boolean;
  };
  uploaded_at: string;
  processed_at?: string;
  is_primary: boolean;
  file_url?: string;
}

export interface JobSkill {
  id?: string;
  skill_id?: string;
  skill_name?: string;
  name?: string;
  category?: string;
  requirement: 'required' | 'preferred';
  weight: number;
  is_mandatory: boolean;
}

export interface Job {
  id: string;
  company_name: string;
  title: string;
  description: string;
  location?: string;
  work_mode: 'onsite' | 'hybrid' | 'remote';
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  min_experience_years: number;
  max_experience_years?: number;
  education_required?: string;
  salary_min?: number;
  salary_max?: number;
  status: 'draft' | 'open' | 'closed';
  job_skills: JobSkill[];
  recruiter_email?: string;
  applicants_count?: number;
  match_preview?: {
    score: number;
    matched_count: number;
    missing_count: number;
  };
  match_score?: number;
  matched_skills_count?: number;
  missing_skills_count?: number;
  explanation_summary?: string;
  created_at: string;
}

export interface MatchBreakdown {
  score: number;
  raw_score?: number;
  semantic_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  matched_skills: Array<{
    name: string;
    requirement: string;
    confidence?: number;
    evidence?: string;
    match_type?: string;
    related_to?: string;
    similarity?: number;
  }>;
  missing_required: Array<{ name: string; weight: number; is_mandatory: boolean }>;
  missing_preferred: Array<{ name: string; weight: number }>;
  related_skills: Array<{
    job_skill: string;
    candidate_skill: string;
    similarity: number;
    credit: number;
  }>;
  top_passages?: Array<{ section: string; text: string; similarity: number }>;
  explanation: string;
  knockout_applied?: boolean;
  algorithm_version?: string;
}

export interface Application {
  id: string;
  job: string | Job;
  job_title?: string;
  company_name?: string;
  job_location?: string;
  work_mode?: string;
  candidate_name?: string;
  candidate_email?: string;
  status: 'applied' | 'screening' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  cover_note?: string;
  history?: Array<{
    id: string;
    from_status: string;
    to_status: string;
    changed_by_email?: string;
    note?: string;
    changed_at: string;
  }>;
  applied_at: string;
  resume?: Resume;
  match_result?: MatchBreakdown;
  match_score?: number;
  breakdown?: {
    semantic_score: number;
    skill_score: number;
    experience_score: number;
    education_score: number;
  };
}
