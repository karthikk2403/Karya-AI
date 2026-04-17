import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import Logo from '../components/Logo';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoading(true);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.isBanned) {
              navigate('/banned');
              return;
            }
            if (userData.mainResumeText) {
              navigate('/dashboard');
            } else {
              navigate('/onboarding');
            }
          } else {
            navigate('/onboarding');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        } finally {
          setIsLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }

      if (userSnap && !userSnap.exists()) {
        // Create new user profile
        try {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString()
          });

          // Send Welcome Email
          fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.displayName
            })
          }).catch(e => console.error("Error sending welcome email:", e));

        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }
      }
      // Redirection is handled by onAuthStateChanged
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary font-sans selection:bg-brand-accent/30 selection:text-brand-accent flex items-center justify-center relative overflow-hidden">
      {/* Background Gradients - Subtle & Sophisticated */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1], 
            opacity: [0.1, 0.2, 0.1],
            x: [0, 30, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[5%] w-[70%] h-[70%] rounded-full bg-brand-accent/10 blur-[140px]"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1], 
            opacity: [0.05, 0.15, 0.05],
            x: [0, -30, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] -right-[10%] w-[60%] h-[80%] rounded-full bg-orange-900/5 blur-[140px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.01] select-none pointer-events-none overflow-hidden">
          <p className="text-[12vw] font-black text-brand-primary whitespace-nowrap rotate-[-10deg] uppercase tracking-[0.2em]">
            KARYA • PROFESSIONAL AI RESUME BUILDER • EST. 2026 • PREMIUM INTELLIGENCE
          </p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md p-12 bg-bg-card/20 border border-border-subtle rounded-[3rem] backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.1)] mx-6"
      >
        <div className="flex flex-col items-center mb-16">
          <Logo size="lg" />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-0.5 bg-brand-accent/30 mt-4 rounded-full"
          />
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-brand-primary tracking-tight mb-3">Welcome Back</h2>
            <p className="text-brand-muted text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
              Access your career intelligence suite and resume optimization tools.
            </p>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className="w-full relative overflow-hidden group bg-brand-primary text-bg-deep py-5 rounded-2xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl uppercase tracking-[0.15em]"
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-bg-deep/20 border-t-bg-deep rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                Continue with Google
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-500" />
              </>
            )}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-bg-deep/5 to-transparent skew-x-12" />
          </button>

          <div className="pt-8 text-center">
            <p className="text-[10px] text-brand-muted/20 uppercase tracking-[0.2em] font-bold">
              Secure Enterprise Authentication
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer Credits - Subtle */}
      <div className="fixed bottom-8 left-0 right-0 z-10 text-center flex flex-col gap-2">
        <p className="text-[8px] font-black text-brand-primary/10 uppercase tracking-[0.3em] leading-relaxed">
          AI RESUME OPTIMIZER ™ • CAREER INTELLIGENCE • ENTERPRISE READY
        </p>
        <p className="text-[7px] font-bold text-brand-muted/5 uppercase tracking-widest mt-1">
          SUPPORT: <a href="mailto:junnurimohankarthikeya@gmail.com" className="text-brand-accent/40 hover:text-brand-accent transition-colors">JUNNURIMOHANKARTHIKEYA@GMAIL.COM</a>
        </p>
      </div>
    </div>
  );
}
