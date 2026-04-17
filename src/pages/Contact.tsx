import React from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Contact() {
  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary font-sans selection:bg-brand-accent/30 selection:text-brand-accent relative overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-border-subtle bg-bg-glass/90 backdrop-blur-xl px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <Logo size="md" />
        </Link>
        <Link 
          to="/" 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Home
        </Link>
      </header>

      <main className="pt-48 pb-32 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h2 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.5em] mb-4">Get in Touch</h2>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-brand-primary uppercase tracking-tighter mb-8">
            Contact Us
          </h1>
          <p className="text-xl text-brand-muted font-serif italic max-w-2xl mx-auto">
            Have questions or need assistance? Our team is here to help you elevate your professional standard.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-12 rounded-[3rem] bg-bg-card border border-border-subtle shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8">
              <Mail className="w-12 h-12 text-brand-accent opacity-10 group-hover:opacity-30 transition-opacity" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-8">
                <Mail className="w-6 h-6 text-brand-accent" />
              </div>
              <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 uppercase">Email Us</h3>
              <a 
                href="mailto:junnurimohankarthikeya@gmail.com" 
                className="text-xl font-medium text-brand-accent hover:underline break-all"
              >
                junnurimohankarthikeya@gmail.com
              </a>
              <div className="mt-8 flex items-center gap-3 text-brand-muted">
                <Clock className="w-4 h-4 text-brand-accent" />
                <p className="text-sm font-bold uppercase tracking-widest">
                  We will reach out to you in 24hrs
                </p>
              </div>
            </div>
          </motion.div>

          {/* Support Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-12 rounded-[3rem] bg-brand-primary text-bg-deep shadow-2xl flex flex-col justify-center"
          >
            <h3 className="text-2xl font-display font-bold mb-8 uppercase tracking-tight">Support Hours</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-bg-deep/10 pb-4">
                <span className="font-bold uppercase tracking-widest text-xs">Monday - Friday</span>
                <span className="font-serif italic">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between items-center border-b border-bg-deep/10 pb-4">
                <span className="font-bold uppercase tracking-widest text-xs">Saturday</span>
                <span className="font-serif italic">10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between items-center pb-4">
                <span className="font-bold uppercase tracking-widest text-xs">Sunday</span>
                <span className="font-serif italic">Closed</span>
              </div>
            </div>
            <div className="mt-12 p-6 rounded-2xl bg-bg-deep/5 border border-bg-deep/10">
              <p className="text-sm font-medium leading-relaxed">
                For enterprise inquiries or partnership opportunities, please specify "Enterprise" in your subject line.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-border-subtle bg-bg-surface py-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
          <Logo size="lg" />
          <p className="text-[9px] font-bold text-brand-muted/40 uppercase tracking-[0.4em]">
            © 2026 KARYA • THE INTELLIGENT STANDARD • ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
}
