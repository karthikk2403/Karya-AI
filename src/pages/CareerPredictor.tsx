import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Compass, Target, ArrowRight, Loader2, Sparkles, TrendingUp, BookOpen } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

interface Resource {
  name: string;
  url: string;
}

interface CareerStep {
  title: string;
  timeline: string;
  description: string;
  skillsToAcquire: string[];
  resources: Resource[];
}

export default function CareerPredictor() {
  const [currentRole, setCurrentRole] = useState('');
  const [dreamRole, setDreamRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [path, setPath] = useState<CareerStep[]>([]);

  const generatePath = async () => {
    if (!currentRole.trim() || !dreamRole.trim()) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Current Role: ${currentRole}\nDream Role: ${dreamRole}\n\nGenerate a realistic career progression path from the current role to the dream role. Break it down into 3-4 logical steps. For each step, provide 2-3 high-quality learning resources (courses, documentation, or platforms) with actual URLs.`,
        config: {
          systemInstruction: "You are an expert career coach. Provide a structured, realistic career path. Output as a JSON array of objects with keys: title (string), timeline (string, e.g., '1-2 years'), description (string), skillsToAcquire (array of strings), resources (array of objects with 'name' and 'url'). Ensure URLs are real and relevant (e.g., Coursera, Udemy, MDN, official docs).",
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        setPath(JSON.parse(response.text));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-10 lg:p-12 custom-scrollbar bg-bg-deep perspective-2000">
      <header className="mb-8 sm:mb-10 lg:mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-primary mb-4 tracking-tighter leading-none">Career Predictor</h1>
        <p className="text-xs sm:text-sm lg:text-lg text-brand-muted font-medium leading-relaxed max-w-2xl">Visualize the exact steps needed to reach your dream role with AI-powered trajectory mapping.</p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Column: Inputs */}
        <div className="w-full lg:w-1/3 flex flex-col gap-8 lg:pr-4 shrink-0">
          <div className="bg-bg-card/50 border border-border-subtle p-8 rounded-3xl flex flex-col gap-6 shadow-2xl">
            <div>
              <label className="text-[10px] font-black mb-3 block text-brand-muted uppercase tracking-widest">Current Role</label>
              <input
                type="text"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g., Junior Frontend Developer"
                className="w-full bg-bg-card border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:border-brand-accent/50 transition-all font-medium"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black mb-3 block text-brand-muted uppercase tracking-widest">Dream Role</label>
              <input
                type="text"
                value={dreamRole}
                onChange={(e) => setDreamRole(e.target.value)}
                placeholder="e.g., VP of Engineering"
                className="w-full bg-bg-card border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:border-brand-accent/50 transition-all font-medium"
              />
            </div>

            <button
              onClick={generatePath}
              disabled={isGenerating || !currentRole.trim() || !dreamRole.trim()}
              className="w-full bg-brand-primary hover:opacity-90 text-bg-deep py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-[0_0_25px_rgba(255,255,255,0.1)]"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Compass className="w-5 h-5" />}
              {isGenerating ? 'MAPPING PATH...' : 'GENERATE CAREER PATH'}
            </button>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="flex-1 bg-bg-card/20 border border-border-subtle rounded-3xl flex flex-col relative p-6 sm:p-10 lg:p-12 min-h-[500px] shadow-2xl overflow-hidden">
          {path.length > 0 ? (
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                  <Target className="w-6 h-6 text-brand-accent" />
                </div>
                <h2 className="text-2xl font-black text-brand-primary tracking-tight">Your Career Trajectory</h2>
              </div>
              
              <div className="relative border-l-2 border-border-subtle ml-6 space-y-16 pb-12">
                {path.map((step, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -50, rotateY: -20, translateZ: -100 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0, translateZ: 0 }}
                    transition={{ 
                      delay: index * 0.3,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                    className="relative pl-10 preserve-3d"
                  >
                    <div className="absolute -left-[13px] top-2 w-6 h-6 rounded-full bg-bg-deep border-2 border-brand-accent flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />
                    </div>
                    
                    <div className="bg-bg-card/50 border border-border-subtle p-8 rounded-3xl hover:border-brand-accent/30 transition-all shadow-xl hover:bg-bg-card/80 group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-black text-brand-primary tracking-tight leading-tight group-hover:text-brand-accent transition-colors">{step.title}</h3>
                        <span className="text-[10px] font-black px-4 py-1.5 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-xl flex items-center gap-2 uppercase tracking-widest self-start sm:self-center">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {step.timeline}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-brand-muted leading-relaxed mb-8 font-medium">{step.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-brand-muted/20 uppercase tracking-widest flex items-center gap-3">
                            <BookOpen className="w-4 h-4" /> SKILLS TO ACQUIRE
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {step.skillsToAcquire.map((skill, i) => (
                              <span key={i} className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.05)]">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-brand-muted/20 uppercase tracking-widest flex items-center gap-3">
                            <Sparkles className="w-4 h-4" /> LEARNING RESOURCES
                          </h4>
                          <div className="flex flex-col gap-2">
                            {step.resources?.map((resource, i) => (
                              <a 
                                key={i} 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-brand-accent/5 text-brand-accent border border-brand-accent/10 rounded-xl hover:bg-brand-accent/20 transition-all flex items-center justify-between group/link"
                              >
                                {resource.name}
                                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Final Destination Node */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  transition={{ delay: path.length * 0.3 + 0.5 }}
                  className="relative pl-10 mt-16"
                >
                  <div className="absolute -left-[18px] top-2 w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-accent to-purple-500 flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.5)] rotate-12">
                    <Sparkles className="w-5 h-5 text-bg-deep -rotate-12" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-purple-400 tracking-tighter">
                    {dreamRole}
                  </h3>
                  <p className="text-sm sm:text-base text-brand-muted mt-2 font-bold uppercase tracking-widest">Your ultimate destination</p>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-brand-muted/10 text-center py-20">
              <div className="w-24 h-24 rounded-3xl bg-bg-card/50 flex items-center justify-center mb-8 border border-border-subtle shadow-2xl">
                <Compass className="w-12 h-12 opacity-20" />
              </div>
              <p className="text-2xl font-black text-brand-muted tracking-tight">No Path Generated</p>
              <p className="text-sm sm:text-base mt-4 max-w-sm text-brand-muted/40 font-medium leading-relaxed">Enter your current role and dream role to visualize your career trajectory with AI precision.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
