import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ArrowRight, FileText, Target, Zap, Briefcase, Sparkles, Wand2, Download, MousePointer2, Keyboard, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Logo from '../components/Logo';

export default function Landing() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary font-sans selection:bg-brand-accent/30 selection:text-brand-accent relative overflow-x-hidden">
      {/* Global Header (Persistent) */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border-subtle bg-bg-glass/90 backdrop-blur-xl px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo size="md" />
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/features" className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Features</Link>
            <Link to="/about" className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">About</Link>
            <Link to="/enterprise" className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Enterprise</Link>
            <Link to="/pricing" className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Pricing</Link>
            <Link to="/contact" className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Contact</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to={user ? "/dashboard" : "/auth"} 
            className="flex items-center px-8 py-2.5 rounded-full bg-brand-primary text-bg-deep text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
          >
            DASHBOARD
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-48 pb-32 px-6 text-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-[15vw] lg:text-[12rem] font-display font-black tracking-tighter leading-[0.8] uppercase mb-8 text-brand-primary">
              Karya
            </h1>
            <p className="text-xl md:text-2xl font-serif italic text-brand-muted mb-12 max-w-2xl mx-auto">
              The Intelligent Standard for Professional Resumes.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link 
                to="/auth" 
                className="w-full sm:w-auto px-10 py-5 rounded-full bg-brand-accent text-bg-deep font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl hover:shadow-brand-accent/20"
              >
                GENERATE YOUR RESUME
              </Link>
              <Link 
                to="/dashboard" 
                className="w-full sm:w-auto px-10 py-5 rounded-full border border-brand-accent text-brand-accent font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-accent hover:text-bg-deep transition-all shadow-sm"
              >
                TAILOR RESUME
              </Link>
              <Link 
                to="/guide" 
                className="w-full sm:w-auto px-10 py-5 rounded-full border border-brand-primary text-brand-primary font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-primary hover:text-bg-deep transition-all shadow-sm"
              >
                HOW TO USE
              </Link>
              <Link 
                to="/resume-builder" 
                className="w-full sm:w-auto px-10 py-5 rounded-full border border-border-subtle text-brand-muted font-black text-xs uppercase tracking-[0.2em] hover:border-brand-primary hover:text-brand-primary transition-all"
              >
                TEMPLATES
              </Link>
            </div>
          </motion.div>
        </section>

        {/* AI & ATS Feature Suite */}
        <section className="py-32 px-6 bg-bg-surface/50 border-y border-border-subtle">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.5em] mb-4">Visual Standards</h2>
              <h3 className="text-4xl md:text-5xl font-display font-bold text-brand-primary uppercase tracking-tight">The Gallery of Excellence</h3>
            </div>

            {/* Template Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
              {[
                { name: 'The Executive', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop', desc: 'Authoritative & Traditional' },
                { name: 'The Minimalist', img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop', desc: 'Clean & Breathable' },
                { name: 'The Creative', img: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop', desc: 'Bold & Distinctive' },
                { name: 'The ATS-Standard', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop', desc: 'Machine-Optimized' }
              ].map((style, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border-subtle shadow-lg"
                >
                  <img src={style.img} alt={style.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 via-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                    <h4 className="text-bg-deep font-display font-bold text-xl mb-1">{style.name}</h4>
                    <p className="text-bg-deep/60 text-[10px] uppercase tracking-widest font-bold">{style.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* AI Feature Highlight */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="p-12 rounded-[3rem] bg-bg-card border border-border-subtle shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8">
                  <Sparkles className="w-12 h-12 text-brand-accent opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-8">
                    <Wand2 className="w-6 h-6 text-brand-accent" />
                  </div>
                  <h4 className="text-2xl font-display font-bold text-brand-primary mb-4 uppercase">AI Auto-Summary</h4>
                  <p className="text-brand-muted font-medium leading-relaxed text-lg">
                    Our AI analyzes your history to write a perfect professional summary in seconds. No more writer's block—just pure impact.
                  </p>
                </div>
              </motion.div>

              {/* Manual Edit Workflow */}
              <div className="p-12 rounded-[3rem] bg-brand-primary text-bg-deep shadow-2xl flex flex-col justify-center">
                <h4 className="text-2xl font-display font-bold mb-12 uppercase tracking-tight">Manual Edit Workflow</h4>
                <div className="space-y-8">
                  {[
                    { step: '1', icon: <Download className="w-5 h-5" />, text: 'Download as PDF' },
                    { step: '2', icon: <MousePointer2 className="w-5 h-5" />, text: 'Open File' },
                    { step: '3', icon: <Sparkles className="w-5 h-5" />, text: 'Add Final Manual Touches' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-full border border-bg-deep/20 flex items-center justify-center text-xs font-black">
                        {item.step}
                      </div>
                      <div className="flex items-center gap-4 text-lg font-medium">
                        <span className="text-brand-accent">{item.icon}</span>
                        {item.text}
                        {i < 2 && <ArrowRight className="w-4 h-4 opacity-30 ml-4" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ground Zero Guide */}
        <section className="py-48 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.5em] mb-4">The Foundation</h2>
            <h3 className="text-5xl md:text-7xl font-display font-bold text-brand-primary uppercase tracking-tighter">HOW TO START FROM SCRATCH</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { step: 'Step 1', icon: '⌨️', title: 'Type Your Details', desc: 'Simply enter your work history and skills. Our clean interface makes data entry effortless.' },
              { step: 'Step 2', icon: '✨', title: 'AI Generation', desc: 'Click "Auto-Write" to let the AI build your summary and polish your bullet points for maximum impact.' },
              { step: 'Step 3', icon: '💾', title: 'Download PDF', desc: 'Save your resume and open it on your device for final edits. Your career, perfectly formatted.' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:shadow-xl transition-all duration-500">
                  {item.icon}
                </div>
                <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-2">{item.step}</h4>
                <h5 className="text-xl font-display font-bold text-brand-primary mb-4 uppercase">{item.title}</h5>
                <p className="text-brand-muted font-medium leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle bg-bg-surface py-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
          <Logo size="lg" />
          <div className="flex flex-wrap justify-center gap-12">
            <Link to="/privacy" className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-brand-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-brand-primary transition-colors">Terms</Link>
            <Link to="/security" className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-brand-primary transition-colors">Security</Link>
            <Link to="/contact" className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-brand-primary transition-colors">Contact</Link>
          </div>
          <p className="text-[9px] font-bold text-brand-muted/40 uppercase tracking-[0.4em]">
            © 2026 KARYA • THE INTELLIGENT STANDARD • SUPPORT: <a href="mailto:junnurimohankarthikeya@gmail.com" className="hover:text-brand-accent transition-colors">JUNNURIMOHANKARTHIKEYA@GMAIL.COM</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
