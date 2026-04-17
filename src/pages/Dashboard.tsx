import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Briefcase, Sparkles, AlertCircle, CheckCircle2, Loader2, Download, Clock, RotateCcw, Trash2, Edit3, MessageSquare, Target, Trophy, Zap, Info, LayoutDashboard, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { triggerPostDownloadAutomation } from '../lib/automation';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { doc, getDoc, query, collection, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import confetti from 'canvas-confetti';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

declare global {
  interface Window {
    Razorpay: any;
  }
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
const ai = new GoogleGenAI({ apiKey: apiKey as string });

interface ResumeVersion {
  id: string;
  timestamp: number;
  jdUrl: string;
  result: any;
  jobId?: string;
  interviewPrepId?: string;
}

function isValidUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    Name: { type: Type.STRING },
    Contact: { type: Type.STRING },
    Summary: { type: Type.STRING, description: "Tailored summary highlighting relevant experience for the JD." },
    MatchScore: { type: Type.NUMBER, description: "ATS Match Score percentage (must be 100)." },
    Education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          Degree: { type: Type.STRING },
          Institution: { type: Type.STRING },
          Year: { type: Type.STRING }
        }
      }
    },
    Experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          Role: { type: Type.STRING },
          Company: { type: Type.STRING },
          Dates: { type: Type.STRING },
          Description: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-5 bullet points. Start with action verbs, include metrics, embed JD keywords." 
          }
        }
      }
    },
    Skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          Category: { type: Type.STRING, description: "Skill category (e.g., Languages, Frameworks, Cloud/DevOps)." },
          Items: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of skills in this category."
          }
        },
        required: ["Category", "Items"]
      },
      description: "Categorized list of skills matching the JD."
    },
    Projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          Name: { type: Type.STRING },
          Description: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "1-3 bullet points highlighting project achievements and tech stack." 
          }
        }
      }
    },
    Certifications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of relevant certifications."
    },
    ATSAnalysis: {
      type: Type.OBJECT,
      properties: {
        Score: { type: Type.NUMBER, description: "Detailed ATS score breakdown (0-100)." },
        KeywordDensity: { type: Type.STRING, description: "Analysis of high-impact keyword usage." },
        ActionVerbUsage: { type: Type.STRING, description: "Analysis of action verb strength and variety." },
        QuantifiableAchievements: { type: Type.STRING, description: "Analysis of metrics and data-driven impact." },
        Recommendations: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Specific, actionable steps to reach 100% score." 
        }
      },
      required: ["Score", "KeywordDensity", "ActionVerbUsage", "QuantifiableAchievements", "Recommendations"]
    }
  },
  required: ["Name", "Contact", "Summary", "MatchScore", "Education", "Experience", "Skills", "Projects", "Certifications", "ATSAnalysis"]
};

const systemInstruction = `You are a world-class executive resume writer and ATS (Applicant Tracking System) optimization expert. Your mission is to reconstruct a candidate's resume to achieve a guaranteed 95-100% ATS match score for a specific Job Description (JD).

CRITICAL RULES FOR 95%+ ATS MATCH:
1. THE "INVISIBLE" FORMATTING RULES:
   - SINGLE COLUMN ONLY: Never use two-column layouts.
   - NO GRAPHICS OR TABLES: Avoid charts, skill bars, images, or tables. Use simple tabs and alignment.
   - STANDARD FONTS: Use web-safe fonts like Arial, Calibri, Georgia, or Helvetica.
   - NO HEADER TRAP: Place contact information (Name, Email, Phone, LinkedIn) at the very top of the main body, NOT in the Word/PDF header section.
   - CONTACT INFO FORMATTING: DO NOT use pipes (|) to separate contact info. Use simple bullet points or clear spacing. Ensure LinkedIn and GitHub links are hyperlinked and written in plain text.

2. STRATEGIC KEYWORD INTEGRATION (THE 95% SECRET):
   - EXACT MATCH: Mirror the JD's terminology exactly (e.g., if it says "Project Management", use that exact phrase).
   - CONTEXTUAL MAPPING: Don't just list keywords; embed them naturally into experience descriptions.
   - LONG-FORM + ABBREVIATION: Use both (e.g., "Search Engine Optimization (SEO)").
   - 80/20 RULE: Focus 80% of keywords on Hard Skills (technical) and 20% on Soft Skills.
   - SKILLS CATEGORIZATION: Group skills into specific categories (e.g., "Languages," "Frameworks," "Cloud/DevOps," "Data Science Tools").
   - HIGH-FREQUENCY KEYWORDS: Always include relevant high-frequency ATS search terms like Pandas, NumPy, Scikit-Learn, or Express.js if applicable to the candidate's background.

3. PROPER SECTION LABELING:
   - Use standard headings: "Work Experience" (not "Professional Timeline"), "Education" (not "Academic Background"), "Skills" (not "Tech Stack").

4. QUANTIFY YOUR IMPACT (GOOGLE XYZ FORMULA):
   - Every bullet point must follow: Action Verb + Task + Result (Number).
   - AIM FOR 3+ BULLETS PER ROLE: Ensure every experience section has at least 3 metric-driven bullet points.
   - Example: "Increased social media following by 25% over 6 months by implementing a new video content strategy."

5. ACTION VERBS & REPETITION CONTROL:
   - Start every bullet point with a strong, varied action verb.
   - AVOID REPETITION: Do not use the same action verb more than twice. 
   - SYNONYMS FOR "AUTOMATED": Use systematized, mechanized, computerized, or programmed.
   - SYNONYMS FOR "OPTIMIZED": Use improved, streamlined, enhanced, or refined.
   - Use stronger verbs: replace "Utilized" with "Optimized" or "Automated" (where appropriate) or "Engineered".

6. ZERO FLUFF & PERFECT GRAMMAR:
   - Remove generic adjectives and filler words. Focus on technical proficiency and measurable outcomes.
   - ZERO TOLERANCE for spelling or grammar errors.

7. SUMMARY EXCELLENCE:
   - The summary must be a high-impact "elevator pitch".
   - TAILORED FIRST SENTENCE: The first sentence MUST match the exact job title from the JD (e.g., "Analytical Computer Science undergraduate seeking a Data Analyst role...").

8. DATES & EDUCATION FORMATTING:
   - Place dates on the same line as the institution or degree.
   - PREFERRED FORMAT: [Degree], [School], [Date] (e.g., "B.Tech in Computer Science, ABC University, 2020 - 2024").

9. PROJECT CONTEXT:
   - Explicitly state the tools used in project bullet points (e.g., "Built with Spring Boot and SQL") to ensure ATS catches those keywords.

10. ABSOLUTE ACCURACY: Do not hallucinate facts. Rephrase existing experience to align with the JD while maintaining truthfulness.

ATS SCORING ALGORITHM REQUIREMENTS:
- Keyword Match (40%): Percentage of core keywords from JD present in resume.
- Formatting (20%): Adherence to single-column, no-graphics, and pipe-free rules.
- Impact (20%): Presence of quantifiable metrics in at least 80% of bullet points.
- Structure (20%): Proper labeling, date alignment, and logical flow of sections.

Additionally, provide a comprehensive ATS Analysis in the 'ATSAnalysis' field. This analysis should objectively evaluate the generated resume against the JD using the scoring algorithm above, identifying strengths and specific areas for further manual refinement if needed to ensure a perfect 100% match. Focus on keyword density, action verb usage, and quantifiable achievements.`;

const LiveTailoring = React.memo(() => {
  const [timeLeft, setTimeLeft] = useState(90);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="h-full flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden rounded-none border-l border-border-subtle bg-bg-deep backdrop-blur-xl shadow-2xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.05),transparent_70%)] animate-pulse" />
      <div className="flex w-full max-w-6xl gap-16 h-[600px] relative z-10 items-center">
        <div className="flex-1 border border-border-subtle rounded-[2rem] p-10 bg-bg-card/40 overflow-hidden relative group h-full shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-deep/20 to-bg-deep/90 z-10" />
          <div className="opacity-10 text-[10px] font-mono leading-relaxed space-y-6">
             <div className="w-3/4 h-2 bg-brand-muted rounded-full" />
             <div className="w-full h-2 bg-brand-muted rounded-full" />
             <div className="w-5/6 h-2 bg-brand-muted rounded-full" />
             <div className="w-full h-2 bg-brand-muted rounded-full mt-12" />
             <div className="w-4/5 h-2 bg-brand-muted rounded-full" />
             <div className="w-full h-2 bg-brand-muted rounded-full" />
             <div className="w-2/3 h-2 bg-brand-muted rounded-full" />
             <div className="w-full h-2 bg-brand-muted rounded-full mt-12" />
             <div className="w-3/4 h-2 bg-brand-muted rounded-full" />
          </div>
          <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
            <div className="w-2 h-2 rounded-full bg-brand-muted/40" />
            <span className="text-[9px] uppercase tracking-[0.3em] text-brand-muted font-black">Source Foundation</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 z-20">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-accent/20 blur-3xl animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center relative">
              <Sparkles className="w-8 h-8 text-brand-accent animate-bounce" />
            </div>
          </div>
          <div className="h-32 w-[1px] bg-gradient-to-b from-brand-accent/50 via-brand-accent/10 to-transparent" />
        </div>
        
        <div className="flex-1 border border-brand-accent/30 rounded-[2rem] p-10 bg-brand-accent/5 overflow-hidden relative shadow-[0_0_100px_rgba(197,160,89,0.15)] h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-deep/20 to-bg-deep/90 z-10" />
          <div className="text-[10px] font-mono leading-relaxed space-y-6 text-brand-accent">
             <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} className="h-2 bg-brand-accent/60 rounded-full shadow-[0_0_20px_rgba(197,160,89,0.5)]" />
             <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.8, delay: 0.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} className="h-2 bg-brand-primary/60 rounded-full shadow-[0_0_20px_rgba(10,10,10,0.5)]" />
             <motion.div initial={{ width: 0 }} animate={{ width: "93%" }} transition={{ duration: 1.2, delay: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} className="h-2 bg-brand-accent/60 rounded-full shadow-[0_0_20px_rgba(197,160,89,0.5)]" />
             <motion.div initial={{ width: 0 }} animate={{ width: "90%" }} transition={{ duration: 1.6, delay: 0.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} className="h-2 bg-brand-primary/60 rounded-full shadow-[0_0_20px_rgba(10,10,10,0.5)] mt-12" />
             <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 1.1, delay: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} className="h-2 bg-brand-accent/60 rounded-full shadow-[0_0_20px_rgba(197,160,89,0.5)]" />
             <motion.div initial={{ width: 0 }} animate={{ width: "95%" }} transition={{ duration: 1.4, delay: 1.0, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} className="h-2 bg-brand-primary/60 rounded-full shadow-[0_0_20px_rgba(10,10,10,0.5)]" />
          </div>
          <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
            <span className="text-[9px] uppercase tracking-[0.3em] text-brand-accent font-black">Neural Synthesis</span>
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
          </div>
        </div>
      </div>
      <div className="mt-20 flex flex-col items-center gap-8 relative z-10">
        <div className="text-center space-y-4">
          <p className="text-[11px] text-brand-accent font-black tracking-[0.5em] uppercase animate-pulse">
            Optimizing for ATS Compatibility
          </p>
          <div className="text-6xl font-display font-bold text-brand-primary tracking-tighter tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>
    </motion.div>

  )
});

const ATSAnalysisPanel = React.memo(({ analysis }: { analysis: any }) => {
  if (!analysis) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto mb-16 space-y-10"
    >
      <div className="flex items-center gap-6 mb-12">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent" />
        <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-brand-primary flex items-center gap-4 font-display">
          <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          Optimization Details
        </h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-brand-accent/30 via-brand-accent/30 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-bg-card/40 border border-border-subtle p-8 rounded-[2.5rem] backdrop-blur-xl group hover:border-brand-accent/30 transition-all duration-700 shadow-lg hover:shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2.5 rounded-xl bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shadow-2xl">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Keyword Density</h3>
            </div>
            <p className="text-xs leading-relaxed text-brand-muted font-medium group-hover:text-brand-primary/80 transition-colors">{analysis.KeywordDensity}</p>
          </div>
        </div>

        <div className="bg-bg-card/40 border border-border-subtle p-8 rounded-[2.5rem] backdrop-blur-xl group hover:border-brand-primary/30 transition-all duration-700 shadow-lg hover:shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-2xl">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Action Verbs</h3>
            </div>
            <p className="text-xs leading-relaxed text-brand-muted font-medium group-hover:text-brand-primary/80 transition-colors">{analysis.ActionVerbUsage}</p>
          </div>
        </div>

        <div className="bg-bg-card/40 border border-border-subtle p-8 rounded-[2.5rem] backdrop-blur-xl group hover:border-brand-accent/30 transition-all duration-700 shadow-lg hover:shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2.5 rounded-xl bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shadow-2xl">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Impact Metrics</h3>
            </div>
            <p className="text-xs leading-relaxed text-brand-muted font-medium group-hover:text-brand-primary/80 transition-colors">{analysis.QuantifiableAchievements}</p>
          </div>
        </div>
      </div>

      <div className="bg-bg-card/60 border border-border-subtle p-10 rounded-[3rem] backdrop-blur-2xl relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-brand-primary mb-8 flex items-center gap-4 font-display">
            <div className="w-8 h-8 rounded-xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
              <CheckCircle2 className="w-4 h-4 text-brand-accent" />
            </div>
            Strategic Recommendations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {analysis.Recommendations?.map((rec: string, i: number) => (
              <div key={i} className="flex gap-5 p-6 rounded-2xl bg-bg-deep/30 border border-border-subtle hover:border-brand-accent/30 transition-all duration-500 group/rec">
                <span className="text-brand-accent font-black text-[11px] mt-0.5 opacity-40 group-hover/rec:opacity-100 transition-opacity">0{i + 1}</span>
                <p className="text-xs text-brand-muted leading-relaxed font-medium group-hover:text-brand-primary/90 transition-colors">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </motion.div>
  );
});

const MatchMeter = React.memo(({ score }: { score: number }) => {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center mb-24 relative group">
      <div className="relative w-72 h-72 sm:w-96 sm:h-96">
        {/* Animated Background Rings - Optimized */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ willChange: 'transform' }}
          className="absolute inset-0 rounded-full border border-brand-accent/10"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ willChange: 'transform' }}
          className="absolute -inset-12 rounded-full border border-brand-accent/5"
        />
        
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 rounded-full bg-brand-accent/5 blur-[120px] group-hover:bg-brand-accent/15 transition-all duration-1000" />
        
        <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_40px_rgba(197,160,89,0.3)]" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C5A059" />
              <stop offset="100%" stopColor="#0A0A0A" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Background Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-brand-muted/10 fill-none"
            strokeWidth="10"
          />
          {/* Progress Ring */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 3, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            className="fill-none"
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#glow)"
            style={{ 
              strokeDasharray: circumference,
              stroke: 'url(#scoreGradient)',
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.4em] mb-2 font-display">Match Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-7xl sm:text-8xl font-black tracking-tighter text-brand-primary font-display">{score}</span>
              <span className="text-2xl font-black text-brand-accent">%</span>
            </div>
            <div className="mt-4 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">ATS Verified</span>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2 }}
        className="mt-12 px-10 py-4 rounded-full bg-bg-glass border border-border-subtle backdrop-blur-xl flex items-center gap-5 shadow-xl hover:border-brand-accent/30 transition-all duration-500"
      >
        <div className="w-3 h-3 rounded-full bg-brand-accent animate-pulse shadow-[0_0_15px_rgba(197,160,89,1)]" />
        <span className="text-[11px] sm:text-sm font-black text-brand-primary uppercase tracking-[0.25em]">
          {score >= 90 ? 'Exceptional Alignment' : score >= 75 ? 'Strong Trajectory' : 'Optimized Match'}
        </span>
      </motion.div>

    </div>
  );
});

export default function Dashboard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const getHostname = (url: string) => {
    try {
      if (!url || url === 'Direct Input') return 'Direct Input';
      return new URL(url).hostname;
    } catch (e) {
      return 'Direct Input';
    }
  };
  const [useMainResume, setUseMainResume] = useState(true);
  const [mainResumeName, setMainResumeName] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [jdUrl, setJdUrl] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdInputMode, setJdInputMode] = useState<'url' | 'manual'>('url');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentPrepId, setCurrentPrepId] = useState<string | null>(null);
  const [targetCompany, setTargetCompany] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editJson, setEditJson] = useState('');
  const [mainResumeText, setMainResumeText] = useState<string | null>(null);
  const [chatInstructions, setChatInstructions] = useState<string[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [hasPaidForResume, setHasPaidForResume] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (auth.currentUser) {
        try {
          const res = await fetch(`/api/wallet-balance?userId=${auth.currentUser.uid}`);
          const data = await res.json();
          setWalletBalance(data.balance || 0);
          setIsSubscribed(data.isPremium || false);
          setPremiumUntil(data.premiumUntil || null);
        } catch (e) {
          console.error("Error fetching balance:", e);
        }
      }
    };
    fetchBalance();
  }, [auth.currentUser]);

  const quickPrompts = [
    "Make ATS-friendly",
    "Focus on projects",
    "Shorten resume",
    "Highlight technical skills",
    "Optimize for software roles",
    "Add measurable impact"
  ];

  const handleAddInstruction = useCallback((instruction: string) => {
    if (!instruction.trim()) return;
    setChatInstructions(prev => [...prev, instruction.trim()]);
    setCurrentChatInput('');
  }, []);

  const handleRemoveInstruction = useCallback((index: number) => {
    setChatInstructions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      try {
        const parsed = JSON.parse(editJson);
        setResult(parsed);
        setIsEditing(false);
        setError(null);
      } catch (err) {
        setError("Invalid JSON format. Please correct it before saving.");
      }
    } else {
      setEditJson(JSON.stringify(result, null, 2));
      setIsEditing(true);
    }
  }, [isEditing, editJson, result]);

  useEffect(() => {
    let unsubscribeVersions: (() => void) | undefined;
    let unsubscribeSub: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch Subscription Status
        const subRef = doc(db, 'subscriptions', user.uid);
        unsubscribeSub = onSnapshot(subRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setIsSubscribed(data.status === 'active' && new Date(data.currentPeriodEnd) > new Date());
          } else {
            setIsSubscribed(false);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `subscriptions/${user.uid}`);
        });

        // Fetch Main Resume
        const fetchMainResume = async () => {
          try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              if (userData.mainResumeName) {
                setMainResumeName(userData.mainResumeName);
                setMainResumeText(userData.mainResumeText);
                setUseMainResume(true);
              } else {
                setUseMainResume(false);
              }
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }
        };

        fetchMainResume();
      } else {
        setMainResumeName(null);
        setMainResumeText(null);
        setIsSubscribed(false);
        if (unsubscribeSub) unsubscribeSub();
        unsubscribeSub = undefined;
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSub) unsubscribeSub();
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !currentJobId) {
      setHasPaidForResume(false);
      return;
    }

    const q = query(
      collection(db, 'payments'),
      where('userId', '==', auth.currentUser.uid),
      where('resumeId', '==', currentJobId),
      where('status', '==', 'succeeded')
    );

    const unsubPayments = onSnapshot(q, (snapshot) => {
      setHasPaidForResume(!snapshot.empty);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'payments');
    });

    return () => unsubPayments();
  }, [auth.currentUser, currentJobId]);

  const handleSetAsMain = useCallback(async (resumeText: string, resumeName: string) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        mainResumeText: resumeText,
        mainResumeName: resumeName
      });
      setMainResumeName(resumeName);
      setMainResumeText(resumeText);
      toast.success('Resume set as main successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to set resume as main.');
    }
  }, []);

  const [jobs, setJobs] = useState<any[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'jobs'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const jobList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobList.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      }));
      setIsJobsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'jobs');
    });
    return () => unsub();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
      }
      setPdfFile(file);
      setUseMainResume(false);
      setError(null);
    }
  }, []);

  const handleMainResumeUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a valid PDF file.');
        return;
      }

      setIsUploadingMain(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let resumeText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          resumeText += strings.join(' ') + '\n';
        }

        if (!resumeText.trim()) {
          throw new Error("Could not extract text from the PDF.");
        }

        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            mainResumeText: resumeText,
            mainResumeName: file.name
          });
          setMainResumeName(file.name);
          setMainResumeText(resumeText);
          setUseMainResume(true);
          toast.success('Main resume uploaded successfully!');
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Failed to process resume.');
      } finally {
        setIsUploadingMain(false);
      }
    }
  }, []);

  const processResume = useCallback(async () => {
    const activeJd = jdInputMode === 'url' ? jdUrl : jdText;
    if (!activeJd.trim()) {
      setError(`Please provide a Job Description ${jdInputMode === 'url' ? 'URL' : 'Text'}.`);
      return;
    }

    let resumeText = '';

    if (useMainResume) {
      resumeText = mainResumeText || '';
      if (!resumeText) {
        setError('Main resume not found. Please upload a new one.');
        return;
      }
    } else {
      if (!pdfFile) {
        setError('Please upload a PDF resume.');
        return;
      }
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          resumeText += strings.join(' ') + '\n';
        }

        if (!resumeText.trim()) {
          throw new Error("Could not extract text from the PDF. It might be an image-based PDF.");
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred reading the PDF.');
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setCurrentJobId(null);
    setCurrentPrepId(null);

    const isUrl = jdInputMode === 'url' && isValidUrl(jdUrl);

    try {
      // Start Automation in parallel
      const automationPromise = triggerPostDownloadAutomation(activeJd, resumeText);
      setIsAutomationRunning(true);

      const resumeResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: `Resume Text:\n${resumeText}` },
            { text: isUrl ? `Job Description URL:\n${jdUrl}` : `Job Description Text:\n${activeJd}` },
            ...(chatInstructions.length > 0 ? [{ text: `Additional Instructions:\n${chatInstructions.join('\n')}` }] : []),
            { text: isUrl ? `Please extract the job description from the URL and tailor the resume to it.` : `Please tailor the resume to this job description.` },
            ...(chatInstructions.length > 0 ? [{ text: `Apply the additional instructions provided by the user while tailoring.` }] : [])
          ]
        },
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          tools: isUrl ? [{ urlContext: {} }] : []
        }
      });

      if (resumeResponse.text) {
        const parsedResult = JSON.parse(resumeResponse.text);
        setResult(parsedResult);
        
        // Success Effect
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C5A059', '#0A0A0A', '#ffffff']
        });

        // Save to history (non-blocking)
        if (auth.currentUser) {
          fetch('/api/save-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: auth.currentUser.uid,
              company: jdInputMode === 'url' ? getHostname(jdUrl) : (parsedResult.Experience?.[0]?.Company || "Direct Input"),
              role: parsedResult.Role || "Tailored Resume",
              resumeText: resumeResponse.text,
              atsScore: parsedResult.MatchScore || 0
            })
          }).catch(e => console.error("Error saving history:", e));
        }

        // Now handle automation result
        automationPromise.then(newJob => {
          setIsAutomationRunning(false);
          if (newJob) {
            setCurrentJobId(newJob.id);
            setCurrentPrepId(newJob.interviewPrepId || null);
            setTargetCompany(newJob.company || (jdInputMode === 'url' ? getHostname(jdUrl) : "Tailored Role"));
            toast.success("Job tracked and interview prep generated!");
          }
        }).catch(err => {
          console.error("Automation failed:", err);
          setIsAutomationRunning(false);
          // Fallback jobId
          const fallbackCompany = jdInputMode === 'url' ? getHostname(jdUrl) : (parsedResult.Role || "Tailored Role");
          setTargetCompany(fallbackCompany);
          setCurrentJobId(`fallback_${crypto.randomUUID()}`);
        });

      } else {
        setError('Failed to generate a response. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  }, [jdInputMode, jdUrl, jdText, useMainResume, mainResumeText, pdfFile, chatInstructions]);

  const generatePDF = useCallback(async () => {
    if (!result) return;
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF();
      let y = 20;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - margin * 2;

      const checkPageBreak = (height: number) => {
        if (y + height > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
      };

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      const name = result.Name || "";
      doc.text(name.toUpperCase(), pageWidth / 2, y, { align: "center" });
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const contact = (result.Contact || "").replace(/\|/g, ' • ');
      doc.text(contact, pageWidth / 2, y, { align: "center" });
      y += 12;

      const addHeader = (title: string) => {
        checkPageBreak(15);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), margin, y);
        y += 2;
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      };

      const addText = (text: string, isBullet = false, isBold = false) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const bulletIndent = 5;
        const textWidth = isBullet ? maxLineWidth - bulletIndent : maxLineWidth;
        const lines = doc.splitTextToSize(text, textWidth);
        checkPageBreak(lines.length * 5);
        lines.forEach((line: string, index: number) => {
          if (isBullet && index === 0) {
            doc.text("•", margin, y);
            doc.text(line, margin + bulletIndent, y);
          } else {
            doc.text(line, isBullet ? margin + bulletIndent : margin, y);
          }
          y += 5;
        });
        y += 2;
      };

      if (result.Summary) {
        addHeader("Professional Summary");
        addText(result.Summary);
        y += 4;
      }

      if (result.Skills && Array.isArray(result.Skills) && result.Skills.length > 0) {
        addHeader("Skills");
        result.Skills.forEach((skillGroup: any) => {
          if (skillGroup.Category && skillGroup.Items && skillGroup.Items.length > 0) {
            addText(`${skillGroup.Category}: ${skillGroup.Items.join(' • ')}`, false, true);
          }
        });
        y += 4;
      }

      if (result.Experience && result.Experience.length > 0) {
        addHeader("Professional Experience");
        result.Experience.forEach((exp: any) => {
          checkPageBreak(15);
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const dates = exp.Dates || "";
          const datesWidth = doc.getTextWidth(dates);
          
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          const role = exp.Role || "";
          const maxRoleWidth = maxLineWidth - datesWidth - 5;
          const roleLines = doc.splitTextToSize(role, maxRoleWidth);
          
          doc.text(roleLines[0], margin, y);
          doc.text(dates, pageWidth - margin, y, { align: "right" });
          y += 5;
          
          if (roleLines.length > 1) {
            for(let i = 1; i < roleLines.length; i++) {
              doc.text(roleLines[i], margin, y);
              y += 5;
            }
          }
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.text(exp.Company || "", margin, y);
          y += 6;

          if (Array.isArray(exp.Description)) {
            exp.Description.forEach((bullet: string) => addText(bullet, true));
          } else if (exp.Description) {
            addText(exp.Description, true);
          }
          y += 3;
        });
      }

      if (result.Projects && result.Projects.length > 0) {
        addHeader("Projects");
        result.Projects.forEach((proj: any) => {
          checkPageBreak(12);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(proj.Name || "", margin, y);
          y += 6;

          if (Array.isArray(proj.Description)) {
            proj.Description.forEach((bullet: string) => addText(bullet, true));
          } else if (proj.Description) {
            proj.Description.split('\n').forEach((bullet: string) => addText(bullet, true));
          }
          y += 3;
        });
      }

      if (result.Education && result.Education.length > 0) {
        addHeader("Education");
        result.Education.forEach((edu: any) => {
          checkPageBreak(10);
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const year = edu.Year || "";
          const yearWidth = doc.getTextWidth(year);
          
          const degreeText = `${edu.Degree}${edu.Institution ? `, ${edu.Institution}` : ''}`;
          const maxDegreeWidth = maxLineWidth - yearWidth - 5;
          const degreeLines = doc.splitTextToSize(degreeText, maxDegreeWidth);
          
          doc.text(degreeLines[0], margin, y);
          doc.text(year, pageWidth - margin, y, { align: "right" });
          y += 5;
          
          if (degreeLines.length > 1) {
            for(let i = 1; i < degreeLines.length; i++) {
              doc.text(degreeLines[i], margin, y);
              y += 5;
            }
          }
          y += 2;
        });
      }

      if (result.Certifications && result.Certifications.length > 0) {
        addHeader("Certifications");
        result.Certifications.forEach((cert: string) => {
          checkPageBreak(5);
          addText(cert, true);
        });
      }

      const originalName = useMainResume ? (mainResumeName || 'Resume') : (pdfFile?.name || 'Resume');
      const baseName = originalName.replace(/\.[^/.]+$/, ""); // Remove extension
      const safeCompany = targetCompany ? `_${targetCompany.replace(/[^a-z0-9]/gi, '_')}` : '';
      const finalFileName = `${baseName}${safeCompany}_Tailored.pdf`;

      doc.save(finalFileName);
      
      toast.success('Resume downloaded successfully!');
      setShowSuccessOverlay(true);

    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF file.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [result, useMainResume, mainResumeName, pdfFile, targetCompany]);

  const handlePayment = useCallback(async () => {
    if (!auth.currentUser) {
      toast.error("Please sign in to complete payment");
      return;
    }

    const DOWNLOAD_COST = 10;
    if (walletBalance >= DOWNLOAD_COST) {
      try {
        const response = await fetch('/api/deduct-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: auth.currentUser.uid,
            amount: DOWNLOAD_COST,
            reason: `Resume Download: ${result?.Name || 'Untitled'}`
          })
        });

        if (response.ok) {
          setWalletBalance(prev => prev - DOWNLOAD_COST);
          toast.success(`₹${DOWNLOAD_COST} deducted from wallet. Downloading...`);
          setHasPaidForResume(true);
          await generatePDF();
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to deduct balance");
        }
      } catch (err) {
        console.error("Deduction error:", err);
        toast.error("Error processing wallet payment");
      }
    } else {
      toast.error(`Insufficient balance. You need ₹${DOWNLOAD_COST}, but have ₹${walletBalance}.`);
      navigate('/wallet');
    }
  }, [auth.currentUser, walletBalance, result, generatePDF, navigate]);

  const handleDownloadPDF = useCallback(async () => {
    if (!result) return;
    
    if (isSubscribed || hasPaidForResume) {
      if (isSubscribed && auth.currentUser) {
        fetch('/api/notify-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: auth.currentUser.uid,
            resumeName: result.Name
          })
        }).catch(e => console.error("Error sending download notification:", e));
      }
      await generatePDF();
    } else {
      await handlePayment();
    }
  }, [result, isSubscribed, hasPaidForResume, generatePDF, handlePayment, auth.currentUser]);

  return (
    <div className="h-full flex flex-col bg-bg-surface overflow-hidden">
      {/* Step Indicator */}
      <div className="px-12 py-6 border-b border-border-subtle bg-white flex items-center justify-between">
        <div className="flex items-center gap-12">
          {[
            { id: 1, label: 'Select Foundation' },
            { id: 2, label: 'Target Job' },
            { id: 3, label: 'Neural Tailoring' }
          ].map((s) => (
            <div key={s.id} className="flex items-center gap-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                step === s.id ? "bg-brand-accent text-bg-deep shadow-lg shadow-brand-accent/20" : 
                step > s.id ? "bg-brand-primary text-bg-deep" : "bg-bg-deep text-brand-muted border border-border-subtle"
              )}>
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                step === s.id ? "text-brand-primary" : "text-brand-muted"
              )}>
                {s.label}
              </span>
              {s.id < 3 && <div className="w-12 h-[1px] bg-border-subtle ml-4" />}
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          {step > 1 && !isProcessing && !result && (
            <button 
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-all"
            >
              Back
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* Step 1: Foundation Selection */}
          {step === 1 && !result && !isProcessing && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col items-center justify-center p-12"
            >
              <div className="w-full max-w-4xl space-y-12 text-center">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-brand-primary uppercase tracking-tight">Source Foundation</h2>
                  <p className="text-sm text-brand-muted max-w-xl mx-auto leading-relaxed">
                    Select your master resume foundation. This document will be the core source for all neural synthesis.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!mainResumeName ? (
                    <button 
                      onClick={() => navigate('/onboarding')}
                      className="p-12 rounded-3xl border-2 border-dashed border-border-subtle bg-white hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all flex flex-col items-center gap-6 group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-brand-accent" />
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-primary block">Upload Master Resume</span>
                        <span className="text-[10px] text-brand-muted uppercase tracking-widest">PDF Format Only</span>
                      </div>
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setUseMainResume(true);
                        setStep(2);
                      }}
                      className={cn(
                        "p-12 rounded-3xl border-2 transition-all flex flex-col items-center gap-6 group text-center",
                        useMainResume ? "border-brand-accent bg-brand-accent/5" : "border-border-subtle bg-white hover:border-brand-accent/30"
                      )}
                    >
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all", useMainResume ? "bg-brand-accent text-bg-deep" : "bg-bg-surface text-brand-muted")}>
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-primary block">Use Master Foundation</span>
                        <span className="text-[10px] text-brand-muted uppercase tracking-widest truncate max-w-[200px] block">{mainResumeName}</span>
                      </div>
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setUseMainResume(false);
                      fileInputRef.current?.click();
                    }}
                    className={cn(
                      "p-12 rounded-3xl border-2 transition-all flex flex-col items-center gap-6 group text-center",
                      !useMainResume && pdfFile ? "border-brand-accent bg-brand-accent/5" : "border-border-subtle bg-white hover:border-brand-accent/30"
                    )}
                  >
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all", !useMainResume && pdfFile ? "bg-brand-accent text-bg-deep" : "bg-bg-surface text-brand-muted")}>
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-widest text-brand-primary block">One-time Upload</span>
                      <span className="text-[10px] text-brand-muted uppercase tracking-widest block">
                        {pdfFile ? pdfFile.name : 'Select PDF Document'}
                      </span>
                    </div>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={(e) => { handleFileChange(e); if (e.target.files?.[0]) setStep(2); }} accept="application/pdf" className="hidden" />
                </div>
                
                {mainResumeName && (
                  <div className="flex items-center justify-center gap-8 pt-8">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] font-black text-brand-muted uppercase tracking-widest hover:text-brand-accent transition-all flex items-center gap-2"
                    >
                      <RotateCcw className="w-3 h-3" /> Replace Foundation
                    </button>
                    <button 
                      onClick={() => navigate('/resume-builder')}
                      className="text-[10px] font-black text-brand-muted uppercase tracking-widest hover:text-brand-accent transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-3 h-3" /> Build New Version
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Target Job Input */}
          {step === 2 && !result && !isProcessing && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col items-center justify-center p-12"
            >
              <div className="w-full max-w-4xl space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-black text-brand-primary uppercase tracking-tight">Target Role</h2>
                  <p className="text-sm text-brand-muted max-w-xl mx-auto leading-relaxed">
                    Provide the job description or URL. Our neural engine will synthesize your foundation to match this specific role perfectly.
                  </p>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-border-subtle p-10 shadow-xl space-y-8">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-brand-accent" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-brand-primary">Job Details</span>
                    </div>
                    <div className="flex bg-bg-surface p-1 rounded-xl border border-border-subtle">
                      <button onClick={() => setJdInputMode('url')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", jdInputMode === 'url' ? "bg-white text-brand-primary shadow-sm" : "text-brand-muted")}>URL</button>
                      <button onClick={() => setJdInputMode('manual')} className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", jdInputMode === 'manual' ? "bg-white text-brand-primary shadow-sm" : "text-brand-muted")}>Manual Text</button>
                    </div>
                  </div>

                  {jdInputMode === 'url' ? (
                    <input
                      type="url"
                      value={jdUrl}
                      onChange={(e) => setJdUrl(e.target.value)}
                      placeholder="Paste LinkedIn, Indeed, or company job URL..."
                      className="w-full p-6 rounded-2xl border border-border-subtle bg-bg-surface/30 text-sm font-bold outline-none focus:border-brand-accent/40 transition-all"
                    />
                  ) : (
                    <textarea
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste the full job description text here..."
                      rows={8}
                      className="w-full p-6 rounded-2xl border border-border-subtle bg-bg-surface/30 text-sm font-bold outline-none focus:border-brand-accent/40 transition-all resize-none custom-scrollbar"
                    />
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">AI Tuning (Optional)</span>
                      <button onClick={() => setIsChatOpen(!isChatOpen)} className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{isChatOpen ? 'Hide' : 'Add Instructions'}</button>
                    </div>
                    <AnimatePresence>
                      {isChatOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden">
                          <div className="flex flex-wrap gap-2">
                            {quickPrompts.map(p => (
                              <button key={p} onClick={() => handleAddInstruction(p)} className="px-4 py-2 rounded-full bg-bg-surface border border-border-subtle text-[9px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-accent transition-all">{p}</button>
                            ))}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={currentChatInput}
                              onChange={(e) => setCurrentChatInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddInstruction(currentChatInput)}
                              placeholder="e.g., 'Focus on my leadership experience' or 'Make it more technical'..."
                              className="w-full bg-bg-surface border border-border-subtle rounded-2xl py-4 pl-6 pr-12 text-xs text-brand-primary outline-none focus:border-brand-accent/40"
                            />
                            <button onClick={() => handleAddInstruction(currentChatInput)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-accent"><MessageSquare className="w-5 h-5" /></button>
                          </div>
                          {chatInstructions.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {chatInstructions.map((inst, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-[9px] font-black text-brand-accent uppercase tracking-widest">
                                  {inst}
                                  <button onClick={() => handleRemoveInstruction(i)}><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setStep(3);
                      processResume();
                    }}
                    disabled={isProcessing || (jdInputMode === 'url' ? !jdUrl.trim() : !jdText.trim())}
                    className="px-12 py-5 rounded-2xl bg-brand-accent text-bg-deep font-black uppercase text-xs tracking-[0.3em] flex items-center gap-3 disabled:opacity-20 transition-all shadow-xl shadow-brand-accent/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4" />
                    Start Synthesis
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Synthesis / Result */}
          {isProcessing && (
            <motion.div key="processing" className="h-full w-full">
              <LiveTailoring />
            </motion.div>
          )}

          {result && !isProcessing && (
            <motion.div 
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col"
            >
              <div className="px-12 py-4 border-b border-border-subtle bg-white flex items-center justify-between z-10">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-brand-primary uppercase tracking-tight block">Synthesis Complete</span>
                      <span className="text-[9px] text-brand-accent font-black uppercase tracking-widest">ATS Match: {result.ATSAnalysis?.Score || result.MatchScore}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleEditToggle}
                    className="p-3 rounded-xl bg-bg-surface hover:bg-white border border-border-subtle text-brand-primary transition-all shadow-sm"
                    title="Edit JSON"
                  >
                    {isEditing ? <CheckCircle2 className="w-5 h-5 text-brand-accent" /> : <Edit3 className="w-5 h-5" />} 
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPdf || isEditing}
                    className="px-8 py-3 bg-brand-primary text-bg-deep hover:opacity-90 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 disabled:opacity-20 shadow-lg"
                  >
                    {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {(isSubscribed || hasPaidForResume) ? 'Download PDF' : 'Pay & Download'}
                  </button>
                  {currentPrepId && (
                    <button
                      onClick={() => navigate(`/interview?jobId=${currentJobId}`)}
                      className="px-8 py-3 bg-brand-accent text-bg-deep rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-brand-accent/20 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Interview Prep
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setResult(null);
                      setStep(1);
                    }}
                    className="px-6 py-3 rounded-xl border border-border-subtle text-[11px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-all"
                  >
                    New Tailoring
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-bg-surface">
                <div className="max-w-6xl mx-auto p-12 space-y-16">
                  <MatchMeter score={result.ATSAnalysis?.Score || result.MatchScore || 96} />

                  {!isEditing && result.ATSAnalysis && (
                    <ATSAnalysisPanel analysis={result.ATSAnalysis} />
                  )}
                  
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="bg-white p-8 rounded-3xl border border-border-subtle shadow-xl">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                            <Edit3 className="w-5 h-5 text-brand-accent" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary">Advanced Editor</h3>
                            <p className="text-[10px] text-brand-muted uppercase tracking-widest mt-1">Directly modify the synthesized profile data</p>
                          </div>
                        </div>
                        <textarea
                          value={editJson}
                          onChange={(e) => setEditJson(e.target.value)}
                          className="w-full h-[600px] bg-brand-primary border border-border-subtle rounded-2xl p-8 text-xs font-mono text-white/90 focus:outline-none focus:border-brand-accent/40 custom-scrollbar shadow-inner transition-all"
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white text-black p-16 sm:p-24 shadow-[0_40px_100px_rgba(0,0,0,0.1)] font-sans relative border border-border-subtle mx-auto max-w-[850px]" id="resume-preview">
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                      
                      <header className="text-center border-b-2 border-black pb-10 mb-12">
                        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-[0.2em] mb-6 text-black">{result.Name}</h1>
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] sm:text-[11px] font-bold text-neutral-600 uppercase tracking-[0.3em]">
                          {result.Contact?.split('|').map((part: string, i: number) => (
                            <span key={i} className="flex items-center gap-4">
                              {i > 0 && <span className="text-neutral-300">•</span>}
                              {part.trim()}
                            </span>
                          ))}
                        </div>
                      </header>

                      <section className="mb-12">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-black mb-6 border-b border-neutral-200 pb-2">Professional Summary</h2>
                        <p className="text-sm leading-[1.8] text-black font-medium text-justify">{result.Summary}</p>
                      </section>

                      <section className="mb-12">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-black mb-8 border-b border-neutral-200 pb-2">Strategic Competencies</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                          {result.Skills?.map((skillGroup: any, i: number) => (
                            <div key={i}>
                              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-3">{skillGroup.Category}</h3>
                              <div className="flex flex-wrap gap-2">
                                {skillGroup.Items?.map((item: string, j: number) => (
                                  <span key={j} className="text-[11px] font-bold text-black uppercase tracking-wider">{item}{j < skillGroup.Items.length - 1 ? ',' : ''}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="mb-12">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-black mb-10 border-b border-neutral-200 pb-2">Professional Experience</h2>
                        <div className="space-y-12">
                          {result.Experience?.map((exp: any, i: number) => (
                            <div key={i}>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 mb-4">
                                <h3 className="text-lg font-black uppercase tracking-tight text-black">{exp.Role}</h3>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{exp.Dates}</span>
                              </div>
                              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-6">{exp.Company}</div>
                              <ul className="space-y-4">
                                {exp.Description?.map((bullet: string, j: number) => (
                                  <li key={j} className="text-sm leading-relaxed text-black flex gap-4">
                                    <span className="text-neutral-300 mt-1.5">•</span>
                                    <span className="flex-1 text-justify">{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>

                      <footer className="mt-16 pt-8 border-t border-neutral-100 text-center">
                        <p className="text-[7px] font-black text-neutral-300 uppercase tracking-[0.4em]">Synthesized by KARYA LEKHA ™ • Neural Career Intelligence</p>
                      </footer>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
          {showSuccessOverlay && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl bg-bg-card border border-border-subtle rounded-[3rem] p-12 text-center shadow-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black text-brand-primary uppercase tracking-tighter mb-6">Download Started!</h2>
                <div className="space-y-6 mb-10">
                  <div className="p-6 rounded-2xl bg-brand-accent/5 border border-brand-accent/20 text-left">
                    <div className="flex items-start gap-4">
                      <Info className="w-6 h-6 text-brand-accent shrink-0 mt-1" />
                      <p className="text-brand-muted font-medium leading-relaxed">
                        Your professional base is ready. Please open the downloaded PDF to perform final manual adjustments or personalized content additions.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-brand-muted font-medium italic">
                    Tip: Check your "Downloads" folder for the file.
                  </p>
                </div>
                <button 
                  onClick={() => setShowSuccessOverlay(false)}
                  className="w-full bg-brand-primary text-bg-deep py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                >
                  Got it
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
}
