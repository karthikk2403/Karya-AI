import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      await addDoc(collection(db, 'reviews'), {
        id: crypto.randomUUID(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userEmail: user.email,
        userPhoto: user.photoURL || '',
        message: message.trim(),
        rating,
        createdAt: new Date().toISOString()
      });

      setIsSuccess(true);
      toast.success("Thank you for your feedback!");
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setMessage('');
        setRating(5);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-bg-card border border-border-subtle rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-deep/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                  <MessageSquare className="w-5 h-5 text-brand-accent" />
                </div>
                <h3 className="text-xl font-black tracking-tight uppercase">Share Feedback</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-bg-card/50 text-brand-muted hover:text-brand-primary border border-border-subtle transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h4 className="text-2xl font-black text-brand-primary uppercase tracking-tight mb-2">Feedback Received!</h4>
                  <p className="text-brand-muted font-medium">Your insights help us make Karya better for everyone.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-4 block">How would you rate your experience?</label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-3 rounded-xl border transition-all ${
                            rating >= star 
                              ? 'bg-brand-accent/10 border-brand-accent/30 text-brand-accent' 
                              : 'bg-bg-deep border-border-subtle text-brand-muted/20 hover:text-brand-muted/40'
                          }`}
                        >
                          <Star className={`w-6 h-6 ${rating >= star ? 'fill-brand-accent' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-4 block">Your Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you think, suggest features, or report issues..."
                      className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-6 text-sm min-h-[150px] focus:outline-none focus:border-brand-accent/50 transition-all font-medium resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-accent text-bg-deep py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.1)] disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
