export interface HRQuestion {
  question: string;
  bestAnswer: string;
  tips: string;
}

export interface TechQuestion {
  question: string;
  bestAnswer: string;
  tips: string;
}

export interface AssessmentQuestion {
  question: string;
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

export interface CompanyPrep {
  about: string;
  focusAreas: string[];
}

export interface ResumeQuestion {
  question: string;
  bestAnswer: string;
}

export interface AceThisJob {
  focusAreas: string[];
  roadmap: string[];
  tips: string[];
}

export interface InterviewPrepModule {
  id: string;
  userId: string;
  jobId: string;
  companyName: string;
  roleName: string;
  dateCreated: string;
  hrQuestions: HRQuestion[];
  technicalQuestions: TechQuestion[];
  assessmentPrep: AssessmentQuestion[];
  companyPrep: CompanyPrep;
  resumeQuestions: ResumeQuestion[];
  aceThisJob: AceThisJob;
  status?: 'generating' | 'completed';
  location?: string;
  workMode?: string;
  salary?: string;
  skillsRequired?: string[];
}
