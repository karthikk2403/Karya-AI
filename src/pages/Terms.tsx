import React from 'react';
import { motion } from 'motion/react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
            <FileText className="w-8 h-8 text-bg-deep" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">Terms of Service</h1>
          <p className="text-brand-muted font-medium text-xl">The rules of engagement for our platform.</p>
        </header>

        <div className="space-y-12 text-brand-muted leading-relaxed">
          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using Karya, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">2. Use License</h2>
            <p>Permission is granted to temporarily use our AI tools for personal, non-commercial career development purposes. This is the grant of a license, not a transfer of title.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">3. Disclaimer</h2>
            <p>The AI-generated content is provided "as is". While we strive for 100% ATS compatibility, we do not guarantee employment or specific recruitment outcomes.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">4. Limitations</h2>
            <p>In no event shall Karya or its suppliers be liable for any damages arising out of the use or inability to use the materials on our platform.</p>
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
