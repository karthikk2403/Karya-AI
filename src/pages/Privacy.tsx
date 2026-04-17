import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary font-sans selection:bg-brand-accent/30 selection:text-brand-accent relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-24">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <header className="mb-16">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center shadow-2xl mb-8">
            <Eye className="w-8 h-8 text-bg-deep" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">Privacy Policy</h1>
          <p className="text-brand-muted font-medium text-xl">Your data privacy is our top priority.</p>
        </header>

        <div className="space-y-12 text-brand-muted leading-relaxed">
          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">1. Data Collection</h2>
            <p>We collect only the information necessary to provide our AI-powered resume tailoring services. This includes your contact details, professional history, and job descriptions you provide for synthesis.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">2. AI Processing</h2>
            <p>Your resume data is processed by advanced neural models to generate tailored content. We do not use your personal data to train public models without your explicit consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">3. Data Security</h2>
            <p>We implement enterprise-grade security measures to protect your information. All data is encrypted in transit and at rest using industry-standard protocols.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">4. Your Rights</h2>
            <p>You have the right to access, correct, or delete your data at any time through your account settings or by contacting our support team.</p>
          </section>
        </div>

        <footer className="mt-24 pt-12 border-t border-border-subtle text-center">
          <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">
            Last Updated: April 9, 2026 • Karya • Professional AI Resume Builder
          </p>
        </footer>
      </div>
    </div>
  );
}
