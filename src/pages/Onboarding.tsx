import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Upload, CheckCircle2, ArrowRight, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Onboarding() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
      }
      setPdfFile(file);
      setError(null);
    }
  };

  const handleContinue = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let resumeText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        resumeText += strings.join(' ') + '\n';
      }

      if (!resumeText.trim()) {
        throw new Error("Could not extract text from the PDF. It might be an image-based PDF.");
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated.");
      }

      // Store the main resume text in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        mainResumeText: resumeText,
        mainResumeName: pdfFile.name
      });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary font-sans selection:bg-brand-accent/30 selection:text-brand-accent flex flex-col items-center justify-center relative overflow-y-auto py-20 px-4">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] w-[50%] h-[70%] rounded-full bg-cyan-900/10 blur-[120px]"
        />
        
        {/* Watermark - Professionalized */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.005] select-none pointer-events-none overflow-hidden">
          <p className="text-[12vw] font-black text-brand-primary whitespace-nowrap rotate-[-10deg] uppercase tracking-[0.2em]">
            KARYA LEKHA ™ • AI CAREER INTELLIGENCE • ENTERPRISE READY
          </p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl p-8 bg-bg-card/50 border border-border-subtle rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)] mb-6">
          <FileText className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-3 text-center text-brand-primary">Upload Your Master Resume</h1>
        <p className="text-brand-muted text-center max-w-md mb-6">
          We'll use this as the foundation for all your tailored applications.
        </p>

        <div className="flex flex-col items-center gap-4 mb-10 w-full">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand-accent/5 border border-brand-accent/20 w-full">
            <Sparkles className="w-5 h-5 text-brand-accent" />
            <div className="flex-1">
              <p className="text-xs font-black text-brand-primary uppercase tracking-tight">No resume? No problem.</p>
              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Create a high-ATS master resume in minutes.</p>
            </div>
            <button 
              onClick={() => navigate('/resume-builder')}
              className="px-4 py-2 rounded-xl bg-brand-accent text-bg-deep text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
            >
              Create One
            </button>
          </div>
          <div className="flex items-center gap-4 w-full">
            <div className="h-[1px] flex-1 bg-border-subtle" />
            <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em]">OR UPLOAD</span>
            <div className="h-[1px] flex-1 bg-border-subtle" />
          </div>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            pdfFile 
              ? "border-brand-accent/50 bg-brand-accent/5" 
              : "border-border-subtle hover:border-brand-accent/50 hover:bg-bg-card/80"
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
            className="hidden" 
          />
          {pdfFile ? (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-brand-accent" />
              <span className="font-semibold text-lg text-brand-primary">{pdfFile.name}</span>
              <span className="text-sm text-brand-accent/70">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-bg-card/50 flex items-center justify-center">
                <Upload className="w-8 h-8 text-brand-muted/50" />
              </div>
              <span className="font-semibold text-lg text-brand-primary/80">Click to upload PDF</span>
              <span className="text-sm text-brand-muted/40">Max size: 10MB</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl w-full text-center text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-bg-deep border border-border-subtle text-brand-muted py-4 rounded-xl font-semibold text-lg hover:text-brand-primary hover:border-brand-primary/30 transition-all"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            disabled={!pdfFile || isProcessing}
            className="flex-[2] bg-brand-primary text-bg-deep py-4 rounded-xl font-semibold text-lg hover:opacity-90 disabled:bg-bg-card/50 disabled:text-brand-muted/30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              <>Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </div>
      </motion.div>

      {/* Footer Credits - Subtle */}
      <div className="mt-12 text-center flex flex-col gap-2 relative z-10">
        <p className="text-[8px] font-black text-brand-muted/10 uppercase tracking-[0.3em] leading-relaxed">
          KARYA LEKHA ™ • AI CAREER INTELLIGENCE • ENTERPRISE READY
        </p>
        <p className="text-[7px] font-bold text-brand-muted/5 uppercase tracking-widest mt-1">
          SUPPORT: <a href="mailto:junnurimohankarthikeya@gmail.com" className="text-brand-accent/40 hover:text-brand-accent transition-colors">JUNNURIMOHANKARTHIKEYA@GMAIL.COM</a>
        </p>
      </div>
    </div>
  );
}
