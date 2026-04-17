import React from 'react';
import { ShieldAlert, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Banned = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-bg-card/20 border border-red-500/30 p-12 rounded-[2.5rem] backdrop-blur-3xl text-center"
      >
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-black tracking-tighter uppercase mb-4">
          Access <span className="text-red-500">Terminated</span>
        </h1>
        
        <p className="text-brand-muted text-sm font-medium mb-8 leading-relaxed">
          Your account has been suspended for violating our terms of service or due to administrative action. You can no longer access the platform features.
        </p>

        <div className="bg-bg-deep/50 border border-border-subtle p-4 rounded-2xl mb-8 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center">
            <Mail className="w-5 h-5 text-brand-muted" />
          </div>
          <div>
            <div className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Support</div>
            <div className="text-xs font-black">junnurimohankarthikeya@gmail.com</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-full bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
};

export default Banned;
