import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Security() {
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
            <Shield className="w-8 h-8 text-bg-deep" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">Security Architecture</h1>
          <p className="text-brand-muted font-medium text-xl">Enterprise-grade protection for your professional future.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {[
            { title: "End-to-End Encryption", desc: "All data transfers are secured using TLS 1.3 protocols." },
            { title: "Secure Storage", desc: "Resumes are stored with AES-256 encryption at rest." },
            { title: "Identity Protection", desc: "Multi-factor authentication and secure session management." },
            { title: "Regular Audits", desc: "Continuous security monitoring and periodic penetration testing." }
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-3xl bg-bg-card/30 border border-border-subtle backdrop-blur-xl">
              <CheckCircle className="w-6 h-6 text-brand-accent mb-4" />
              <h3 className="text-lg font-black text-brand-primary uppercase tracking-tight mb-2">{item.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-12 text-brand-muted leading-relaxed">
          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">Infrastructure</h2>
            <p>Our platform is built on world-class cloud infrastructure, providing high availability and regional data residency compliance. We leverage isolated environments for AI processing to ensure zero data leakage between users.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tight mb-4">Compliance</h2>
            <p>We adhere to global data protection standards and continuously update our security protocols to meet evolving cybersecurity challenges.</p>
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
