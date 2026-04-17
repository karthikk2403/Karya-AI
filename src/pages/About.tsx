import React from 'react';
import { motion } from 'motion/react';
import { Heart, Zap, Globe, Compass, Target, Briefcase, MessageSquare, Award, LineChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function About() {
  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary selection:bg-brand-accent/30 selection:text-brand-accent overflow-x-hidden">
      {/* Background Elements */}
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
          <Link to="/about" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent transition-colors">About</Link>
          <Link to="/enterprise" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Enterprise</Link>
          <Link to="/pricing" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Pricing</Link>
          <Link to="/contact" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-8">
          <Link to="/auth" className="text-[10px] font-black bg-brand-primary text-bg-deep px-8 py-4 rounded-full hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)]">Join Karya</Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8 lg:px-16 py-32">
        <div className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8"
          >
            <Heart className="w-3 h-3" />
            Our Story
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-black tracking-tighter uppercase mb-12 leading-[0.9] text-brand-primary"
          >
            Built For <span className="text-brand-accent italic font-serif">Excellence</span> <br/>
            <span className="text-brand-muted/20">To The World.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-brand-muted max-w-3xl mx-auto font-medium leading-relaxed font-serif italic"
          >
            Karya was forged with a singular, uncompromising mission: to democratize elite recruitment intelligence for every ambitious professional on the planet.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h3 className="text-4xl font-black uppercase tracking-tighter text-brand-primary">The Vision</h3>
            <p className="text-brand-muted leading-relaxed font-medium">
              We believe that language and location should never be a barrier to career success. Our AI engine is designed to understand the nuances of your experience and translate it into a language that global recruitment systems understand.
            </p>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                <Heart className="w-6 h-6 text-brand-accent fill-brand-accent/20" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-brand-muted">Crafted with precision</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="aspect-video rounded-[3rem] bg-gradient-to-br from-brand-accent/20 to-purple-500/20 border border-border-subtle relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/vision/1920/1080')] bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700" />
            <div className="absolute inset-0 bg-bg-deep/40 backdrop-blur-sm group-hover:backdrop-blur-none transition-all duration-700" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-16 h-16 text-brand-muted/20 group-hover:text-brand-accent transition-colors duration-500" />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-16 rounded-[3rem] bg-gradient-to-br from-purple-500/10 via-bg-card/50 to-brand-accent/10 border border-border-subtle text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="text-4xl font-black uppercase tracking-tighter mb-6 text-brand-primary">Ready to transform your career?</h3>
            <p className="text-brand-muted mb-12 max-w-xl mx-auto font-medium">Join thousands of professionals who have secured their dream roles using Karya's intelligent synthesis engine.</p>
            <Link to="/auth" className="inline-flex items-center gap-4 bg-brand-primary text-bg-deep px-12 py-6 rounded-full font-black text-lg hover:opacity-90 transition-all uppercase tracking-[0.2em]">
              Start Your Journey
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 py-24 border-t border-border-subtle bg-bg-glass backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-8 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-12">
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
