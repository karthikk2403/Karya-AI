import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, Zap, Shield, Target, Loader2, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { toast } from 'sonner';
import Logo from '../components/Logo';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PricingCard = ({ title, price, description, features, recommended, delay, onSelect, isProcessing }: { 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  recommended?: boolean,
  delay: number,
  onSelect: () => void,
  isProcessing: boolean,
  key?: any
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className={`p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] backdrop-blur-3xl border transition-all duration-500 flex flex-col h-full relative overflow-hidden group ${
      recommended 
        ? 'bg-brand-primary/5 border-brand-accent/30 shadow-[0_0_50px_rgba(34,211,238,0.1)]' 
        : 'bg-bg-card/20 border-border-subtle hover:border-brand-accent/30'
    }`}
  >
    {recommended && (
      <div className="absolute top-8 right-8 bg-brand-accent text-bg-deep text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-2xl">
        Most Popular
      </div>
    )}
    
    <div className="mb-12">
      <h3 className={`text-xs font-black uppercase tracking-[0.4em] mb-6 ${recommended ? 'text-brand-accent' : 'text-brand-muted'}`}>
        {title}
      </h3>
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-6xl font-black text-brand-primary tracking-tighter">{price}</span>
        {price !== "Custom" && <span className="text-brand-muted font-bold text-lg">/mo</span>}
      </div>
      <p className="text-brand-muted font-medium leading-relaxed">{description}</p>
    </div>

    <div className="flex-1 space-y-6 mb-12">
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-4 group/item">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
            recommended ? 'bg-brand-accent/10 border-brand-accent/20' : 'bg-bg-card border-border-subtle group-hover/item:border-brand-accent/30'
          }`}>
            <Check className={`w-3.5 h-3.5 ${recommended ? 'text-brand-accent' : 'text-brand-muted group-hover/item:text-brand-accent'}`} />
          </div>
          <span className="text-sm font-medium text-brand-muted group-hover/item:text-brand-primary transition-colors">{feature}</span>
        </div>
      ))}
    </div>

    <button 
      onClick={onSelect}
      disabled={isProcessing}
      className={`w-full py-6 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${
        recommended 
          ? 'bg-brand-primary text-bg-deep hover:opacity-90 shadow-[0_0_30px_rgba(34,211,238,0.3)]' 
          : 'bg-bg-card border border-border-subtle text-brand-primary hover:bg-brand-primary hover:text-bg-deep'
      }`}
    >
      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : (title === "Professional" ? <Zap className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
      {isProcessing ? 'Processing...' : 'Select Plan'}
    </button>
  </motion.div>
);

export default function Pricing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleSubscribe = async (plan: any) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate('/auth');
      return;
    }

    if (plan.title === "Custom Plan") {
      navigate('/wallet');
      return;
    }

    if (plan.title === "Pay As You Use") {
      navigate('/wallet');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          amount: 399,
          type: 'subscription'
        })
      });

      if (!response.ok) throw new Error("Failed to create order");
      const order = await response.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Karya Premium",
        description: "Monthly Subscription",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                userId: user.uid
              })
            });

            if (verifyRes.ok) {
              toast.success("Welcome to Karya Premium!");
              navigate('/dashboard');
            } else {
              toast.error("Payment verification failed");
            }
          } catch (err) {
            toast.error("Verification error");
          }
        },
        prefill: {
          email: user.email,
          name: user.displayName
        },
        theme: { color: "#22d3ee" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const plans = [
    {
      title: "Pay As You Use",
      price: "Flexible",
      description: "Pay only for what you use with our wallet system.",
      features: [
        "₹10 per Resume Synthesis",
        "AI-Powered Content Generation",
        "Basic ATS Analysis",
        "Standard PDF Export",
        "Email Support"
      ]
    },
    {
      title: "Professional",
      price: "₹399",
      description: "Unlimited career intelligence for serious advancement.",
      recommended: true,
      features: [
        "Unlimited AI Syntheses",
        "Full ATS Optimization Suite",
        "Premium Badge on Profile",
        "Interview Prep Hub",
        "Priority Support"
      ]
    },
    {
      title: "Custom Plan",
      price: "Custom",
      description: "Tailored solutions for recruitment firms and universities.",
      features: [
        "Bulk User Management",
        "Custom AI Training",
        "API Access",
        "Dedicated Account Manager",
        "SLA Guarantees",
        "White-label Options"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary selection:bg-brand-accent/30 selection:text-brand-accent overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-accent/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/5 blur-[120px]" />
      </div>

      <header className="relative z-50 border-b border-border-subtle bg-bg-glass backdrop-blur-3xl px-6 sm:px-8 lg:px-16 py-6 sm:py-8 flex items-center justify-between sticky top-0">
        <Link to="/" className="group">
          <Logo size="md" />
        </Link>
        <nav className="hidden md:flex items-center gap-12 lg:gap-16">
          <Link to="/features" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Features</Link>
          <Link to="/about" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">About</Link>
          <Link to="/enterprise" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Enterprise</Link>
          <Link to="/pricing" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent transition-colors">Pricing</Link>
          <Link to="/contact" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/auth" className="text-[9px] sm:text-[10px] font-black bg-brand-primary text-bg-deep px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:opacity-90 transition-all uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)]">Join Karya</Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-16 sm:py-32">
        <div className="text-center mb-16 sm:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card/50 border border-border-subtle text-brand-accent text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-6 sm:mb-8"
          >
            Investment
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-9xl font-black tracking-tighter uppercase mb-8 sm:mb-12 leading-[0.85] text-brand-primary"
          >
            Professional <br/>
            <span className="text-brand-accent">Tiering.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-brand-muted max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Choose the plan that aligns with your professional ambitions. From surgical precision to unlimited career intelligence.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-32">
          {plans.map((plan, index) => (
            <PricingCard 
              key={index} 
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              recommended={plan.recommended}
              delay={0.1 * index} 
              onSelect={() => handleSubscribe(plan)}
              isProcessing={isProcessing && plan.title === "Professional"}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-center mb-16 text-brand-primary">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-brand-primary font-bold mb-4">Can I cancel anytime?</h4>
              <p className="text-brand-muted text-sm leading-relaxed">Yes, all our monthly plans are commitment-free. You can cancel your subscription at any time from your settings dashboard.</p>
            </div>
            <div>
              <h4 className="text-brand-primary font-bold mb-4">What is AI Synthesis?</h4>
              <p className="text-brand-muted text-sm leading-relaxed">Synthesis is our proprietary process of analyzing a job description and rebuilding your resume to perfectly align with its requirements.</p>
            </div>
            <div>
              <h4 className="text-brand-primary font-bold mb-4">Is my data secure?</h4>
              <p className="text-brand-muted text-sm leading-relaxed">Absolutely. We use enterprise-grade encryption and never share your personal data or resumes with third-party recruiters without your consent.</p>
            </div>
            <div>
              <h4 className="text-brand-primary font-bold mb-4">Do you offer student discounts?</h4>
              <p className="text-brand-muted text-sm leading-relaxed">We do! Contact our support team with your academic credentials to receive a 50% discount on the Professional plan.</p>
            </div>
          </div>
        </div>
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
