import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Zap, ShieldCheck, TrendingUp, ArrowRight, CheckCircle2, DollarSign, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function Marketing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Wallet className="w-6 h-6 text-brand-accent" />,
      title: "Prepaid Wallet",
      description: "Add funds once and use them whenever you need. No more repeated payment steps for every download."
    },
    {
      icon: <Zap className="w-6 h-6 text-brand-accent" />,
      title: "Instant Access",
      description: "Once funds are in your wallet, downloads are instant. One click and your resume is ready."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-accent" />,
      title: "Secure & Transparent",
      description: "Track every rupee with our detailed transaction history. Your funds are safe and always available."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-brand-accent" />,
      title: "Pay As You Go",
      description: "Only pay for what you use. No expensive monthly subscriptions that you don't fully utilize."
    }
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary selection:bg-brand-accent/30">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(0,0,0,0.05),transparent)]" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-black uppercase tracking-widest mb-8"
          >
            <Shield className="w-3 h-3" />
            The Future of Payments is Here
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8"
          >
            USE YOUR WALLET.<br />
            <span className="text-brand-accent">USE YOUR NEEDS.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-brand-muted leading-relaxed mb-12"
          >
            Stop worrying about subscriptions. Our new prepaid wallet system gives you total control over your spending. Add funds, build your career, and only pay for what you actually use.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/wallet')}
              className="w-full sm:w-auto bg-brand-accent text-bg-deep px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,255,255,0.3)]"
            >
              Go to My Wallet
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto bg-black/5 border border-black/10 text-brand-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black/10 transition-all"
            >
              Start Building
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-3xl bg-bg-deep/50 border border-border-subtle hover:border-brand-accent/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest mb-4">{feature.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-12">
            WHY PREPAID IS <span className="text-brand-accent">BETTER</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-black/5 border border-black/10 text-left">
              <h4 className="text-brand-muted uppercase font-black tracking-widest text-xs mb-6">Traditional Subscriptions</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-brand-muted/60">
                  <span className="text-red-500 mt-1">✕</span>
                  Monthly recurring charges even if you don't use it
                </li>
                <li className="flex items-start gap-3 text-sm text-brand-muted/60">
                  <span className="text-red-500 mt-1">✕</span>
                  Complex cancellation processes
                </li>
                <li className="flex items-start gap-3 text-sm text-brand-muted/60">
                  <span className="text-red-500 mt-1">✕</span>
                  Wasted money on unused features
                </li>
              </ul>
            </div>
            
            <div className="p-8 rounded-3xl bg-brand-accent/5 border border-brand-accent/20 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <CheckCircle2 className="w-6 h-6 text-brand-accent" />
              </div>
              <h4 className="text-brand-accent uppercase font-black tracking-widest text-xs mb-6">Karya Wallet System</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-brand-primary">
                  <CheckCircle2 className="w-4 h-4 text-brand-accent mt-0.5" />
                  Pay only ₹10 per download
                </li>
                <li className="flex items-start gap-3 text-sm text-brand-primary">
                  <CheckCircle2 className="w-4 h-4 text-brand-accent mt-0.5" />
                  Funds never expire
                </li>
                <li className="flex items-start gap-3 text-sm text-brand-primary">
                  <CheckCircle2 className="w-4 h-4 text-brand-accent mt-0.5" />
                  Total control over your budget
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-brand-accent/20 to-brand-accent/5 border border-brand-accent/20 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 relative z-10">
            READY TO <span className="text-brand-accent">TOP UP?</span>
          </h2>
          <p className="text-brand-muted max-w-xl mx-auto mb-10 relative z-10">
            Join thousands of professionals who are taking control of their career tools. Add as little as ₹50 to get started.
          </p>
          
          <button
            onClick={() => navigate('/wallet')}
            className="relative z-10 bg-brand-accent text-bg-deep px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_0_50px_rgba(0,0,0,0.1)]"
          >
            Add Funds Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border-subtle/30 text-center">
        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">
          © {new Date().getFullYear()} KARYA LEKHA ™ / ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
}
