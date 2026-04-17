import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Globe, Target, Briefcase, MessageSquare, Award, LineChart, ArrowRight, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number, key?: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-8 rounded-[2.5rem] bg-bg-card/20 border border-border-subtle backdrop-blur-3xl hover:bg-bg-card/40 transition-all duration-500 group"
  >
    <div className="w-14 h-14 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-8 border border-brand-accent/20 group-hover:scale-110 transition-transform duration-500">
      <Icon className="w-7 h-7 text-brand-accent" />
    </div>
    <h3 className="text-xl font-bold mb-4 text-brand-primary tracking-tight">{title}</h3>
    <p className="text-brand-muted leading-relaxed text-sm">{description}</p>
  </motion.div>
);

export default function Features() {
  const features = [
    {
      icon: Target,
      title: "ATS Optimization",
      description: "Our AI mirrors job description keywords and structures your resume to pass through any Applicant Tracking System with a 100% match score."
    },
    {
      icon: Zap,
      title: "Instant Synthesis",
      description: "Tailor your resume for any specific job role in under 60 seconds. No more manual editing for every application."
    },
    {
      icon: MessageSquare,
      title: "Interview Prep Hub",
      description: "Get personalized interview questions and talking points based on your tailored resume and the specific job requirements."
    },
    {
      icon: Briefcase,
      title: "Job Tracker",
      description: "Manage your entire application pipeline in one place. Track status, dates, and follow-ups with ease."
    },
    {
      icon: Compass,
      title: "Career Predictor",
      description: "Visualize your professional trajectory with AI-powered path mapping. Get step-by-step guidance to reach your dream role."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is encrypted and secure. We never share your personal information or resumes with third parties."
    }
  ];

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
          <Link to="/features" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent transition-colors">Features</Link>
          <Link to="/about" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">About</Link>
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
            <Zap className="w-3 h-3" />
            Capabilities
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-9xl font-display font-black tracking-tighter uppercase mb-12 leading-[0.85] text-brand-primary"
          >
            Engineered <br/>
            <span className="text-brand-accent italic font-serif">For Success.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-brand-muted max-w-3xl mx-auto font-medium leading-relaxed font-serif italic"
          >
            Karya integrates advanced neural synthesis with executive recruitment logic to provide an uncompromising advantage in the global talent marketplace.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} delay={0.1 * index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-16 rounded-[3rem] bg-gradient-to-br from-brand-accent/10 via-bg-card/50 to-purple-500/10 border border-border-subtle text-center relative overflow-hidden"
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
