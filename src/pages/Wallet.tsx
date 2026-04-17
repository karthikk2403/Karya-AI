import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet as WalletIcon, Plus, History, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Zap, TrendingUp, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

export default function Wallet() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchBalance(user.uid);
        // We could fetch transactions here too
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchBalance = async (userId: string) => {
    try {
      const res = await fetch(`/api/wallet-balance?userId=${userId}`);
      const data = await res.json();
      setBalance(data.balance || 0);
    } catch (e) {
      console.error("Error fetching balance:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!user) return;
    if (topupAmount < 20 || topupAmount > 2000) {
      toast.error("Amount must be between ₹20 and ₹2000");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          amount: topupAmount
        })
      });

      if (!response.ok) throw new Error("Failed to create order");
      const order = await response.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Karya Wallet",
        description: "Add funds to your wallet",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.uid
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.status === 'success') {
              toast.success(`₹${topupAmount} added to your wallet!`);
              fetchBalance(user.uid);
            } else {
              toast.error(verifyData.error || "Payment verification failed");
            }
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("Error verifying payment");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || ""
        },
        theme: { color: "#22d3ee" },
        modal: {
          ondismiss: () => setIsProcessing(false)
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Topup error:", err);
      toast.error("Failed to initialize payment");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary font-sans selection:bg-brand-accent/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-3 text-brand-muted hover:text-brand-primary transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center group-hover:border-brand-accent/50 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-accent" />
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Secure Payments</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Wallet Card */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-card/40 border border-border-subtle rounded-[2.5rem] p-10 backdrop-blur-2xl luxury-shadow relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                    <WalletIcon className="w-7 h-7 text-brand-accent" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">Your Wallet</h1>
                    <p className="text-xs text-brand-muted uppercase tracking-widest font-bold">Prepaid Balance System</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                  <div>
                    <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] mb-2 block">Available Balance</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black tracking-tighter text-gradient">₹{balance.toFixed(2)}</span>
                      <span className="text-xl font-black text-brand-muted uppercase tracking-widest">INR</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Pay as you go</span>
                    </div>
                    <p className="text-[10px] text-brand-muted leading-relaxed max-w-[200px]">
                      Use your balance for resume exports and interview prep. No hidden fees.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Topup Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-bg-card/40 border border-border-subtle rounded-[2.5rem] p-10 backdrop-blur-2xl"
            >
              <h2 className="text-lg font-black mb-8 flex items-center gap-3">
                <Plus className="w-5 h-5 text-brand-accent" />
                Add Funds
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[20, 50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopupAmount(amt)}
                    className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                      topupAmount === amt 
                        ? 'bg-brand-accent/10 border-brand-accent text-brand-accent shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
                        : 'bg-bg-deep/50 border-border-subtle text-brand-muted hover:border-border-hover'
                    }`}
                  >
                    <span className="text-xl font-black">₹{amt}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Select</span>
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Custom Amount (₹20 - ₹2000)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-muted font-black">₹</span>
                    <input 
                      type="number"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(Number(e.target.value))}
                      className="w-full bg-bg-deep/50 border border-border-subtle rounded-2xl px-10 py-4 text-lg font-black focus:outline-none focus:border-brand-accent/50 transition-all"
                      min="20"
                      max="2000"
                    />
                  </div>
                </div>

                <button
                  onClick={handleTopup}
                  disabled={isProcessing || topupAmount < 20 || topupAmount > 2000}
                  className="w-full bg-brand-primary text-bg-deep py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  {isProcessing ? 'Processing...' : `Add ₹${topupAmount} to Wallet`}
                </button>

                <div className="flex items-center justify-center gap-6 pt-4">
                  <div className="flex items-center gap-2 text-[9px] text-brand-muted font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" />
                    Encrypted
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-brand-muted font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" />
                    Instant Credit
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-brand-accent/20 to-purple-500/20 border border-brand-accent/20 rounded-[2.5rem] p-8"
            >
              <Zap className="w-8 h-8 text-brand-accent mb-6" />
              <h3 className="text-lg font-black mb-4">Why Wallet?</h3>
              <ul className="space-y-4">
                {[
                  "No recurring subscriptions",
                  "Pay only for what you use",
                  "Instant resume downloads",
                  "Unlock premium prep features",
                  "Balance never expires"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
                    <span className="text-xs text-brand-primary/80 leading-relaxed font-medium">{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-bg-card/40 border border-border-subtle rounded-[2.5rem] p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <History className="w-5 h-5 text-brand-muted" />
                <h3 className="text-sm font-black uppercase tracking-widest">Recent Activity</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-bg-deep border border-border-subtle flex items-center justify-center mb-4">
                    <AlertCircle className="w-5 h-5 text-brand-muted/30" />
                  </div>
                  <p className="text-[10px] text-brand-muted uppercase tracking-widest font-bold">No recent transactions</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
