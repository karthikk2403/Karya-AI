export type JobStatus = 
  | 'Saved Draft' 
  | 'Applied' 
  | 'Interview' 
  | 'Assessment' 
  | 'Selected' 
  | 'Rejected';

export interface JobRecord {
  id: string;
  userId: string;
  company: string;
  role: string;
  jobLink?: string;
  dateApplied: string;
  location?: string;
  workMode?: 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown';
  salary?: string;
  skillsRequired: string[];
  resumeVersionUsed?: string;
  status: JobStatus;
  notes?: string;
  sourcePlatform?: string;
  jobDescriptionSnapshot: string;
  keywordsExtracted: string[];
  atsMatchScore?: number;
  interviewPrepId?: string;
  tailoredResumeResult?: any;
  createdAt: string;
  updatedAt: string;
}
