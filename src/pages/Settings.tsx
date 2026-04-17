import React from 'react';
import { useTheme } from '../lib/ThemeContext';
import { Sun, Moon, Monitor, Shield, Bell, User, Globe, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const sections = [
    {
      title: 'Appearance',
      icon: <Zap className="w-5 h-5 text-brand-accent" />,
      description: 'Customize how the platform looks for you.',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
            { id: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
            { id: 'system', label: 'System', icon: <Monitor className="w-5 h-5" /> },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setTheme(option.id as any)}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300 ${
                theme === option.id
                  ? 'border-brand-accent bg-brand-accent/5 text-brand-accent shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                  : 'border-border-subtle bg-bg-card/20 text-brand-muted/40 hover:border-border-subtle/50 hover:bg-bg-card/40'
              }`}
            >
              {option.icon}
              <span className="text-xs font-bold uppercase tracking-widest">{option.label}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Account Settings',
      icon: <User className="w-5 h-5 text-purple-500" />,
      description: 'Manage your personal information and preferences.',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-card/20 border border-border-subtle flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-brand-primary">Email Notifications</p>
              <p className="text-xs text-brand-muted/40">Receive updates about your job applications.</p>
            </div>
            <div className="w-12 h-6 bg-brand-accent/20 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-brand-accent rounded-full" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Privacy & Security',
      icon: <Shield className="w-5 h-5 text-emerald-500" />,
      description: 'Control your data and security settings.',
      content: (
        <div className="space-y-4">
          <button className="w-full p-4 rounded-xl bg-bg-card/20 border border-border-subtle text-left hover:bg-bg-card/40 transition-all flex items-center justify-between">
            <span className="text-sm font-bold text-brand-primary">Data Export</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted/20">Request Archive</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-8 lg:p-16 overflow-y-auto custom-scrollbar bg-bg-deep">
      <header className="mb-16">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-bg-card/50 border border-border-subtle text-brand-accent text-[10px] font-black uppercase tracking-[0.2em] mb-8">
          Platform Configuration
        </div>
        <h1 className="text-6xl lg:text-8xl font-black text-brand-primary mb-8 tracking-tighter uppercase leading-none">
          Settings<span className="text-brand-muted/20">.</span>
        </h1>
        <p className="text-lg text-brand-muted max-w-2xl font-medium leading-relaxed">
          Fine-tune your experience and manage your professional identity.
        </p>
      </header>

      <div className="max-w-4xl space-y-12">
        {sections.map((section, idx) => (
          <motion.section
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-2xl bg-bg-card/50 border border-border-subtle flex items-center justify-center shrink-0">
                {section.icon}
              </div>
              <div>
                <h2 className="text-xl font-black text-brand-primary uppercase tracking-widest mb-2">{section.title}</h2>
                <p className="text-sm text-brand-muted font-medium">{section.description}</p>
              </div>
            </div>
            <div className="pl-18">
              {section.content}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
