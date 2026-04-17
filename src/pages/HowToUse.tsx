import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, MousePointer2, Layout, Download, ArrowRight, CheckCircle2, HelpCircle, Zap, Target, FileText } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function HowToUse() {
  const navigate = useNavigate();

  const steps = [
    {
      title: "Step 1: Fill Your Details",
      desc: "Type your name, work history, and skills. Don't worry about the wording—our AI will polish it for you!",
      icon: <MousePointer2 className="w-12 h-12 text-cyan-400" />,
      color: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20"
    },
    {
      title: "Step 2: Pick a Style",
      desc: "Choose a template you like. Whether you want it to look modern, professional, or creative, we've got you covered.",
      icon: <Layout className="w-12 h-12 text-purple-400" />,
      color: "bg-purple-500/10",
      borderColor: "border-purple-500/20"
    },
    {
      title: "Step 3: Click the Big Button",
      desc: "Hit the 'Generate' button and watch the magic happen. Your resume will be ready in seconds!",
      icon: <Zap className="w-12 h-12 text-yellow-400" />,
      color: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20"
    },
    {
      title: "Step 4: Download & Apply",
      desc: "Download your high-quality PDF and start applying to your dream jobs with confidence.",
      icon: <Download className="w-12 h-12 text-emerald-400" />,
      color: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary selection:bg-brand-accent/30 selection:text-brand-accent relative overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-accent/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/5 blur-[120px]" />
      </div>

      <header className="relative z-50 border-b border-border-subtle bg-bg-glass backdrop-blur-3xl px-8 lg:px-16 py-8 flex items-center justify-between sticky top-0">
        <Link to="/" className="group">
          <Logo size="md" />
        </Link>
        <nav className="hidden md:flex items-center gap-16">
          <Link to="/features" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Features</Link>
          <Link to="/about" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">About</Link>
          <Link to="/enterprise" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Enterprise</Link>
          <Link to="/pricing" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Pricing</Link>
          <Link to="/contact" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-8">
          <Link to="/auth" className="text-[10px] font-black bg-brand-primary text-bg-deep px-8 py-4 rounded-full hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)]">Join Karya</Link>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-8 py-24">
        <header className="text-center mb-20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-3xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shadow-2xl mx-auto mb-8"
          >
            <HelpCircle className="w-10 h-10 text-brand-accent" />
          </motion.div>
          <h1 className="text-5xl sm:text-7xl font-display font-black tracking-tighter uppercase mb-6">Beginner's <span className="text-brand-accent italic font-serif">Guide.</span></h1>
          <p className="text-xl text-brand-muted max-w-2xl mx-auto font-medium leading-relaxed font-serif italic">
            Welcome to Karya. Let's get you started with your professional resume in just a few easy steps.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-10 rounded-[3rem] border ${step.borderColor} ${step.color} backdrop-blur-xl luxury-shadow group hover:scale-[1.02] transition-all duration-500`}
            >
              <div className="mb-8 p-6 rounded-3xl bg-bg-deep/50 w-fit border border-white/5 shadow-inner">
                {step.icon}
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase mb-4 text-brand-primary">{step.title}</h2>
              <p className="text-lg text-brand-muted font-medium leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-bg-card/40 border border-border-subtle p-12 rounded-[4rem] text-center luxury-shadow relative overflow-hidden mb-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-8">Ready to start?</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => navigate('/resume-builder')}
              className="bg-brand-primary text-bg-deep px-12 py-6 rounded-full font-black text-xl uppercase tracking-widest flex items-center justify-center gap-4 hover:opacity-90 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] group"
            >
              <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Build My Resume
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-bg-card/50 border border-border-subtle text-brand-primary px-12 py-6 rounded-full font-black text-xl uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-bg-card/80 transition-all group"
            >
              <Target className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-24 border-t border-border-subtle bg-bg-glass backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <Logo size="sm" />
            <div className="flex flex-col items-center md:items-end gap-5">
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] text-center md:text-right leading-relaxed">
                KARYA • THE INTELLIGENT STANDARD • EST. 2026
              </p>
              <p className="text-[8px] font-bold text-brand-muted uppercase tracking-[0.2em]">
                SUPPORT: <a href="mailto:junnurimohankarthikeya@gmail.com" className="text-brand-accent/40 hover:text-brand-accent transition-colors">JUNNURIMOHANKARTHIKEYA@GMAIL.COM</a>
              </p>
            </div>
          </div>
        </footer>
    </div>
  );
}
