import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Code, Building2, FileText, 
  Target, ChevronDown, ChevronUp, Search, 
  Bookmark, PlayCircle, CheckCircle2, Lightbulb,
  Clock, ArrowRight, Loader2, MapPin, DollarSign, Sparkles, Send, User, Bot
} from 'lucide-react';
import { InterviewPrepModule, HRQuestion, TechQuestion } from '../types/interview';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function InterviewPrep() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId');
  
  const [prepModules, setPrepModules] = useState<InterviewPrepModule[]>([]);
  const [activeModule, setActiveModule] = useState<InterviewPrepModule | null>(null);
  const [activeTab, setActiveTab] = useState<'hr' | 'tech' | 'company' | 'flashcards' | 'ai-chat'>('hr');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Request States
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const model = "gemini-3-flash-preview";
      const systemInstruction = `You are an elite executive interview coach for ${activeModule?.companyName} for the role of ${activeModule?.roleName}. 
      Your advice should be strategic, high-impact, and focused on leadership and technical excellence.
      Context:
      - Company: ${activeModule?.companyName}
      - Role: ${activeModule?.roleName}
      - Skills: ${activeModule?.skillsRequired?.join(', ')}
      - About Company: ${activeModule?.companyPrep?.about}`;

      const response = await ai.models.generateContent({
        model,
        contents: [...chatMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })), { role: 'user', parts: [{ text: userMessage }] }],
        config: { systemInstruction }
      });

      const aiResponse = response.text || "I'm sorry, I couldn't generate a response. Please try again.";
      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!requestText.trim() || isRequesting) return;

    setIsRequesting(true);
    try {
      const response = await fetch('/api/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: auth.currentUser?.email,
          request: requestText
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setRequestText('');
        setShowRequestModal(false);
      } else {
        toast.error("Failed to send request. Please try again.");
      }
    } catch (error) {
      console.error("Request Error:", error);
      toast.error("Failed to send request. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, 'interviewPreps'), where('userId', '==', user.uid));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const prepsData: InterviewPrepModule[] = [];
          snapshot.forEach((doc) => {
            prepsData.push({ id: doc.id, ...doc.data() } as InterviewPrepModule);
          });
          
          prepsData.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
          setPrepModules(prepsData);
          
          if (jobId) {
            const found = prepsData.find(p => p.jobId === jobId);
            if (found) {
              setActiveModule(found);
              setLoading(false);
            } else {
              const timeout = setTimeout(() => {
                setLoading(false);
                toast.info("Still generating your interview prep. Please wait a moment...");
              }, 15000);
              return () => clearTimeout(timeout);
            }
          } else {
            setActiveModule(null);
            setLoading(false);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'interviewPreps');
          setLoading(false);
        });
      } else {
        setPrepModules([]);
        setLoading(false);
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribe) unsubscribe();
    };
  }, [jobId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-bg-deep">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!jobId || !activeModule) {
    return (
      <div className="h-full flex flex-col p-8 lg:p-16 overflow-y-auto custom-scrollbar bg-bg-deep">
        <header className="mb-24">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-bg-card/50 border border-border-subtle text-brand-accent text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            Intelligence Hub
          </div>
          <h1 className="text-6xl lg:text-8xl font-black text-brand-primary mb-8 tracking-tighter uppercase leading-none">
            Interview <br/>
            <span className="text-brand-primary/20">Readiness.</span>
          </h1>
          <p className="text-lg text-brand-muted max-w-2xl font-medium leading-relaxed">
            Strategic preparation modules engineered for elite performance. 
            Select a trajectory to begin your simulation.
          </p>
        </header>

        {prepModules.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-32 bg-bg-card/20 rounded-[3rem] border border-border-subtle">
            <MessageSquare className="w-12 h-12 text-brand-muted/10 mb-8" />
            <h2 className="text-2xl font-black text-brand-primary mb-4 uppercase tracking-widest">No Active Trajectories</h2>
            <p className="text-brand-muted/30 max-w-md mb-12 text-sm font-medium">Tailor your first resume to activate the intelligence engine.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-brand-primary text-bg-deep px-10 py-4 rounded-full font-black text-xs tracking-[0.2em] uppercase"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {prepModules.map((prep) => (
              <PrepCard key={prep.id} prep={prep} onClick={() => navigate(`/interview?jobId=${prep.jobId}`)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const filteredHR = activeModule.hrQuestions?.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredTech = activeModule.technicalQuestions?.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const allFlashcards = [
    ...(activeModule.hrQuestions || []).map(q => ({ ...q, type: 'Behavioral' })),
    ...(activeModule.technicalQuestions || []).map(q => ({ ...q, type: 'Technical' }))
  ];

  const handleNextCard = () => {
    if (flashcardIndex < allFlashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setFlashcardIndex(prev => prev + 1), 150);
    }
  };

  const handlePrevCard = () => {
    if (flashcardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setFlashcardIndex(prev => prev - 1), 150);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8 relative bg-bg-deep">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <header className="max-w-5xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="px-3 py-1 rounded-full bg-bg-card/50 border border-border-subtle text-brand-accent text-[8px] font-black uppercase tracking-[0.3em] shadow-xl">
              Simulation Active
            </div>
            <span className="text-brand-muted/20 text-[8px] font-black uppercase tracking-[0.3em]">{new Date(activeModule.dateCreated).toLocaleDateString()}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-brand-primary leading-tight tracking-tighter uppercase">
            {activeModule.companyName} <span className="text-brand-primary/10 ml-2">{activeModule.roleName}</span>
          </h1>
        </header>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRequestModal(true)}
            className="px-6 py-3 rounded-xl bg-bg-card/50 border border-border-subtle text-brand-muted/40 hover:text-brand-primary hover:bg-bg-card/80 text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Support
          </button>
          <button 
            onClick={() => navigate('/interview')}
            className="px-6 py-3 rounded-xl bg-brand-primary text-bg-deep text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Exit
          </button>
        </div>
      </div>

      {activeModule.status === 'generating' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-brand-muted/10 animate-spin mb-8" />
          <h2 className="text-2xl font-black text-brand-primary mb-4 uppercase tracking-widest">Synthesizing Strategy</h2>
          <p className="text-brand-muted/30 max-w-md font-medium">
            Engineering custom interview modules based on role requirements and JD analysis.
          </p>
          <div className="mt-12 w-full max-w-xs h-1 bg-bg-card/50 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 180, ease: "linear" }}
              className="h-full bg-brand-primary"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-8 mb-6 border-b border-border-subtle overflow-x-auto scrollbar-hide shrink-0">
            {[
              { id: 'hr', label: 'Behavioral', icon: MessageSquare },
              { id: 'tech', label: 'Technical', icon: Code },
              { id: 'company', label: 'Company', icon: Building2 },
              { id: 'flashcards', label: 'Flashcards', icon: PlayCircle },
              { id: 'ai-chat', label: 'AI Coach', icon: Sparkles },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 pb-3 text-[8px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'text-brand-primary border-brand-primary' 
                    : 'text-brand-muted/20 border-transparent hover:text-brand-muted/40'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 pr-2 pb-20">
            <AnimatePresence mode="wait">
              {activeTab === 'hr' && (
                <motion.div key="hr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {filteredHR.map((q, idx) => (
                    <QuestionCard key={idx} question={q} index={idx} isExpanded={expandedId === idx} onToggle={() => setExpandedId(expandedId === idx ? null : idx)} />
                  ))}
                </motion.div>
              )}

              {activeTab === 'tech' && (
                <motion.div key="tech" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {filteredTech.map((q, idx) => (
                    <QuestionCard key={idx} question={q} index={idx} isExpanded={expandedId === idx} onToggle={() => setExpandedId(expandedId === idx ? null : idx)} />
                  ))}
                </motion.div>
              )}

              {activeTab === 'company' && (
                <motion.div key="company" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-bg-card/20 border border-border-subtle p-16 rounded-[3rem] shadow-2xl">
                    <h3 className="text-2xl font-black text-brand-primary mb-10 uppercase tracking-widest flex items-center gap-4">
                      <Building2 className="w-6 h-6 text-brand-accent" /> Analysis
                    </h3>
                    <p className="text-brand-muted/50 leading-relaxed font-medium text-lg">
                      {activeModule.companyPrep?.about}
                    </p>
                  </div>
                  <div className="bg-bg-card/20 border border-border-subtle p-16 rounded-[3rem] shadow-2xl">
                    <h3 className="text-2xl font-black text-brand-primary mb-10 uppercase tracking-widest flex items-center gap-4">
                      <Target className="w-6 h-6 text-brand-accent" /> Strategic Focus
                    </h3>
                    <ul className="space-y-8">
                      {activeModule.companyPrep?.focusAreas?.map((area, i) => (
                        <li key={i} className="flex items-start gap-6 text-base text-brand-muted/60 font-medium">
                          <div className="w-2 h-2 rounded-full bg-brand-accent mt-2 shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {activeTab === 'flashcards' && (
                <motion.div key="flashcards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12">
                  {allFlashcards.length > 0 ? (
                    <>
                      <div className="w-full max-w-2xl aspect-[3/2] perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                        <div className="relative w-full h-full transition-transform duration-700 transform-style-3d" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                          <div className="absolute inset-0 backface-hidden bg-bg-card/20 border border-border-subtle rounded-[3rem] p-16 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-black text-brand-muted/20 uppercase tracking-[0.2em] mb-8">Simulation Question</span>
                            <h4 className="text-3xl font-black text-brand-primary tracking-tighter uppercase leading-tight">
                              {allFlashcards[flashcardIndex].question}
                            </h4>
                          </div>
                          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-brand-primary text-bg-deep rounded-[3rem] p-16 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-black text-bg-deep/40 uppercase tracking-[0.2em] mb-8">Ideal Response</span>
                            <p className="text-xl font-bold leading-relaxed">
                              {allFlashcards[flashcardIndex].bestAnswer}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-12 mt-16">
                        <button onClick={handlePrevCard} disabled={flashcardIndex === 0} className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted/20 hover:text-brand-primary disabled:opacity-0 transition-all">Previous</button>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted/40">{flashcardIndex + 1} / {allFlashcards.length}</span>
                        <button onClick={handleNextCard} disabled={flashcardIndex === allFlashcards.length - 1} className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted/20 hover:text-brand-primary disabled:opacity-0 transition-all">Next</button>
                      </div>
                    </>
                  ) : (
                    <div className="text-brand-muted/20 font-black uppercase tracking-widest">No Simulation Data</div>
                  )}
                </motion.div>
              )}

              {activeTab === 'ai-chat' && (
                <motion.div key="ai-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-280px)] min-h-[500px] bg-bg-card/10 border border-border-subtle rounded-3xl overflow-hidden backdrop-blur-3xl shadow-2xl relative">
                  {/* Chat Header */}
                  <div className="px-8 py-6 border-b border-border-subtle bg-bg-card/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                        <Bot className="w-5 h-5 text-brand-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-brand-primary uppercase tracking-[0.2em]">AI Executive Coach</h3>
                        <p className="text-[9px] font-bold text-brand-muted/20 uppercase tracking-widest">High-Fidelity Simulation</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                      <span className="text-[9px] font-black text-brand-accent uppercase tracking-[0.2em]">Secure Session</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-fixed opacity-90">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-full bg-bg-card/20 border border-border-subtle flex items-center justify-center mb-6 shadow-2xl">
                          <Sparkles className="w-8 h-8 text-brand-muted/10" />
                        </div>
                        <p className="text-xl font-black text-brand-primary/10 uppercase tracking-[0.2em] mb-3">Consult AI Coach</p>
                        <p className="text-[10px] font-bold text-brand-muted/5 uppercase tracking-widest max-w-xs">
                          Ask about strategy, role-specific nuances, or behavioral frameworks.
                        </p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] p-6 rounded-2xl shadow-2xl relative group ${
                          msg.role === 'user' 
                            ? 'bg-brand-primary text-bg-deep rounded-tr-none' 
                            : 'bg-bg-card/30 text-brand-primary/90 border border-border-subtle rounded-tl-none backdrop-blur-xl'
                        }`}>
                          <div className={`absolute top-0 ${msg.role === 'user' ? '-right-1.5' : '-left-1.5'} w-3 h-3 bg-inherit rotate-45 -z-10`} />
                          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap tracking-tight">{msg.content}</p>
                          <div className={`mt-3 flex items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[8px] font-black uppercase tracking-widest">
                              {msg.role === 'user' ? 'Candidate' : 'Executive Coach'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isChatLoading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-bg-card/30 p-6 rounded-2xl rounded-tl-none border border-border-subtle backdrop-blur-xl flex items-center gap-2">
                          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="p-6 border-t border-border-subtle bg-bg-deep/40 backdrop-blur-3xl">
                    <div className="relative max-w-3xl mx-auto">
                      <input
                        type="text"
                        placeholder="Consult with your coach..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        className="w-full bg-bg-card/20 border border-border-subtle rounded-full py-5 pl-8 pr-24 text-brand-primary placeholder:text-brand-primary/10 focus:outline-none focus:border-brand-accent/20 focus:bg-bg-card/40 transition-all font-medium text-base shadow-inner"
                      />
                      <button 
                        onClick={handleSendChatMessage} 
                        disabled={!chatInput.trim() || isChatLoading} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-brand-primary text-bg-deep flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-20 shadow-2xl group"
                      >
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-bg-deep/90 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-2xl bg-bg-card border border-border-subtle rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-16 shadow-2xl">
              <h3 className="text-2xl sm:text-4xl font-black text-brand-primary mb-4 uppercase tracking-tighter">Support Request</h3>
              <p className="text-brand-muted/30 text-[10px] sm:text-sm mb-8 sm:text-sm mb-12 font-medium">Direct line to engineering support.</p>
              <textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} placeholder="Describe your requirement..." className="w-full h-48 bg-bg-card/50 border border-border-subtle rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 text-brand-primary placeholder:text-brand-primary/10 focus:outline-none focus:border-brand-accent/20 transition-all mb-8 sm:mb-12 resize-none font-medium" />
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button onClick={() => setShowRequestModal(false)} className="px-10 py-4 sm:py-5 rounded-full bg-bg-card/50 text-brand-muted/40 font-black text-[10px] uppercase tracking-[0.2em]">Cancel</button>
                <button onClick={handleSendRequest} disabled={!requestText.trim() || isRequesting} className="flex-1 px-10 py-4 sm:py-5 rounded-full bg-brand-primary text-bg-deep font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                  {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isRequesting ? 'Sending' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PrepCardProps {
  prep: InterviewPrepModule;
  onClick: () => void;
}

const PrepCard: React.FC<PrepCardProps> = ({ prep, onClick }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const isGenerating = prep.status === 'generating';
  const isNew = new Date().getTime() - new Date(prep.dateCreated).getTime() < 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!isGenerating) return;

    const calculateTime = () => {
      const createdTime = new Date(prep.dateCreated).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, 180 - Math.floor((now - createdTime) / 1000));
      setTimeLeft(diff);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [prep.dateCreated, isGenerating]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      whileHover={{ y: -12, scale: 1.02 }}
      onClick={isGenerating ? undefined : onClick}
      className={`relative p-6 sm:p-10 lg:p-12 rounded-[2rem] sm:rounded-[3rem] border transition-all cursor-pointer group flex flex-col h-full ${
        isGenerating 
          ? 'bg-bg-card/20 border-border-subtle cursor-wait' 
          : 'bg-bg-card/30 border-border-subtle hover:border-brand-accent/50 hover:bg-bg-card/50 shadow-2xl hover:shadow-brand-accent/20'
      }`}
    >
      {isNew && !isGenerating && (
        <div className="absolute -top-4 -right-4 bg-gradient-to-r from-brand-accent to-purple-500 text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.5)] z-10 flex items-center gap-2 tracking-[0.2em]">
          <Sparkles className="w-4 h-4" /> NEW
        </div>
      )}

      <div className="flex justify-between items-start mb-12">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
          isGenerating ? 'bg-bg-card/50 border-border-subtle' : 'bg-brand-accent/10 border-brand-accent/20 group-hover:bg-brand-accent/20 group-hover:border-brand-accent/40 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]'
        }`}>
          {isGenerating ? (
            <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          ) : (
            <Building2 className="w-8 h-8 text-brand-accent" />
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[11px] font-black text-brand-muted uppercase tracking-[0.2em]">
            {new Date(prep.dateCreated).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
          <span className="text-[10px] font-bold text-brand-muted/50 tracking-widest">
            {new Date(prep.dateCreated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-3xl font-black text-brand-primary mb-3 group-hover:text-brand-accent transition-colors truncate tracking-tighter uppercase">
          {prep.companyName}
        </h3>
        <p className="text-[11px] text-brand-muted mb-10 font-black truncate uppercase tracking-[0.25em]">{prep.roleName}</p>

        {!isGenerating && (
          <div className="space-y-5 mb-12">
            {prep.location && (
              <div className="flex items-center gap-4 text-xs text-brand-muted font-bold uppercase tracking-widest">
                <MapPin className="w-4 h-4 text-brand-accent/50" />
                {prep.location} {prep.workMode ? <span className="text-brand-muted/30">|</span> : ''} {prep.workMode}
              </div>
            )}
            {prep.salary && (
              <div className="flex items-center gap-4 text-xs text-brand-muted font-bold uppercase tracking-widest">
                <DollarSign className="w-4 h-4 text-purple-500/50" />
                {prep.salary}
              </div>
            )}
          </div>
        )}

        {!isGenerating && prep.skillsRequired && prep.skillsRequired.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-12">
            {prep.skillsRequired.slice(0, 3).map((skill, i) => (
              <span key={i} className="text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 bg-bg-card/50 text-brand-muted rounded-xl border border-border-subtle hover:bg-bg-card transition-colors">
                {skill}
              </span>
            ))}
            {prep.skillsRequired.length > 3 && (
              <span className="text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 bg-bg-card/50 text-brand-muted rounded-xl border border-border-subtle">
                +{prep.skillsRequired.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {isGenerating ? (
        <div className="mt-auto space-y-6">
          <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.2em]">
            <span className="text-brand-accent animate-pulse flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-ping" />
              Synthesizing Intelligence...
            </span>
            <span className="text-brand-muted font-mono tracking-widest">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
          </div>
          <div className="w-full h-2.5 bg-bg-card/50 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 180, ease: "linear" }}
              className="h-full bg-gradient-to-r from-brand-accent via-purple-500 to-brand-accent bg-[length:200%_100%] animate-shimmer"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-auto pt-10 border-t border-border-subtle">
          <div className="flex -space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center backdrop-blur-sm shadow-xl" title="Behavioral">
              <MessageSquare className="w-6 h-6 text-brand-accent" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center backdrop-blur-sm shadow-xl" title="Technical">
              <Code className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <button className="text-[11px] font-black uppercase tracking-[0.25em] text-brand-accent flex items-center gap-3 bg-brand-accent/5 px-6 py-3 rounded-2xl border border-brand-accent/10 group-hover:bg-brand-accent/10 transition-all shadow-lg">
            OPEN HUB <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      )}

    </motion.div>
  );
};

interface QuestionCardProps {
  question: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, isExpanded, onToggle }) => {
  return (
    <div className={`bg-bg-card/10 border transition-all duration-500 rounded-2xl overflow-hidden ${isExpanded ? 'border-brand-accent/30 shadow-[0_0_40px_rgba(34,211,238,0.05)] bg-bg-card/30' : 'border-border-subtle hover:border-border-subtle/50 hover:bg-bg-card/20'}`}>
      <button 
        onClick={onToggle}
        className="w-full p-6 sm:p-8 flex items-center justify-between text-left gap-4 sm:gap-6"
      >
        <div className="flex gap-4 sm:gap-6 items-center">
          <span className="text-brand-accent/20 font-black text-lg sm:text-xl tracking-tighter">
            {(index + 1).toString().padStart(2, '0')}
          </span>
          <h3 className={`font-bold text-base sm:text-lg transition-all duration-300 leading-snug tracking-tight ${isExpanded ? 'text-brand-primary' : 'text-brand-primary/70'}`}>
            {question.question}
          </h3>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Bookmark className="hidden sm:block w-4 h-4 text-brand-muted/5 hover:text-brand-accent transition-colors" />
          <div className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-brand-accent/10 text-brand-accent rotate-180' : 'bg-bg-card/50 text-brand-muted/20'}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 sm:p-8 pt-0 border-t border-border-subtle mt-2 space-y-8">
              <div className="relative group">
                <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-brand-accent/20 rounded-full" />
                <h4 className="text-[9px] sm:text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Strategic Response
                </h4>
                <div className="text-brand-primary text-sm sm:text-base leading-relaxed bg-bg-deep/20 p-6 rounded-xl border border-border-subtle shadow-xl font-medium">
                  {question.bestAnswer}
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-purple-500/20 rounded-full" />
                <h4 className="text-[9px] sm:text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" /> Coach Insights
                </h4>
                <p className="text-brand-muted text-sm sm:text-base leading-relaxed italic font-medium pl-1">
                  {question.tips}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
