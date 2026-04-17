import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Layout, User, Briefcase, GraduationCap, Award, Save, Loader2, FileText, Wand2, Search, Download, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

const TEMPLATES = [
  { id: 'modern', name: 'Modern Professional', category: 'Professional', desc: 'Clean, single-column layout with high readability.', color: 'bg-cyan-500', layout: 'single', font: 'Inter', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=400&h=600&auto=format&fit=crop' },
  { id: 'executive', name: 'Executive Suite', category: 'Executive', desc: 'Traditional and authoritative, perfect for senior roles.', color: 'bg-purple-600', layout: 'double', font: 'Space Grotesk', image: 'https://images.unsplash.com/photo-1626197031507-c17099753214?q=80&w=400&h=600&auto=format&fit=crop' },
  { id: 'minimal', name: 'Minimalist', category: 'Simple (ATS-Friendly)', desc: 'Focus on content with generous white space.', color: 'bg-slate-400', layout: 'minimal', font: 'Inter', image: 'https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?q=80&w=400&h=600&auto=format&fit=crop' },
  { id: 'tech', name: 'Tech Focused', category: 'Professional', desc: 'Highlights technical stacks and project impact.', color: 'bg-emerald-500', layout: 'tech', font: 'JetBrains Mono', image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=400&h=600&auto=format&fit=crop' },
  { id: 'creative', name: 'Creative Edge', category: 'Creative', desc: 'Bold typography for a distinctive professional brand.', color: 'bg-rose-500', layout: 'creative', font: 'Space Grotesk', image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=400&h=600&auto=format&fit=crop' },
  { id: 'academic', name: 'Academic CV', category: 'Professional', desc: 'Structured for research and educational backgrounds.', color: 'bg-amber-500', layout: 'academic', font: 'Inter', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=400&h=600&auto=format&fit=crop' },
  { id: 'startup', name: 'Startup Ready', category: 'Creative', desc: 'Dynamic and results-oriented for fast-paced environments.', color: 'bg-indigo-500', layout: 'startup', font: 'Inter', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&h=600&auto=format&fit=crop' },
  { id: 'classic', name: 'Classic Standard', category: 'Simple (ATS-Friendly)', desc: 'The time-tested format that recruiters love.', color: 'bg-blue-600', layout: 'classic', font: 'Inter', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&h=600&auto=format&fit=crop' },
  { id: 'bold', name: 'Bold Impact', category: 'Executive', desc: 'Strong headings and clear section breaks.', color: 'bg-orange-500', layout: 'bold', font: 'Space Grotesk', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=400&h=600&auto=format&fit=crop' },
  { id: 'elegant', name: 'Elegant Serif', category: 'Executive', desc: 'Sophisticated typography for a premium feel.', color: 'bg-teal-500', layout: 'elegant', font: 'Inter', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400&h=600&auto=format&fit=crop' },
];

const CATEGORIES = ['All', 'Professional', 'Creative', 'Executive', 'Simple (ATS-Friendly)'];

const MiniResumePreview = ({ template }: { template: typeof TEMPLATES[0] }) => {
  return (
    <div className="w-full h-full bg-white relative overflow-hidden group">
      <img 
        src={template.image} 
        alt={template.name} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/80 via-transparent to-transparent opacity-80" />
      
      {/* Overlay Layout Indicators */}
      <div className="absolute inset-0 p-4 flex flex-col gap-2 pointer-events-none">
        <div className={`h-1.5 w-1/3 ${template.color} rounded-full opacity-80`} />
        <div className="flex gap-2 h-full">
          {template.layout === 'double' && (
            <div className="w-1/4 h-full border-r border-brand-primary/10 flex flex-col gap-2 pt-4">
              <div className="h-1 w-full bg-brand-primary/20 rounded-full" />
              <div className="h-1 w-3/4 bg-brand-primary/20 rounded-full" />
              <div className="h-1 w-1/2 bg-brand-primary/20 rounded-full" />
            </div>
          )}
          <div className="flex-1 flex flex-col gap-2 pt-4">
            <div className="h-1 w-3/4 bg-brand-primary/40 rounded-full" />
            <div className="h-1 w-1/2 bg-brand-primary/20 rounded-full" />
            <div className="mt-4 space-y-1">
              <div className="h-0.5 w-full bg-brand-primary/10 rounded-full" />
              <div className="h-0.5 w-full bg-brand-primary/10 rounded-full" />
              <div className="h-0.5 w-5/6 bg-brand-primary/10 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Layout Badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-surface/80 backdrop-blur-md border border-border-subtle">
        <Layout className="w-3 h-3 text-brand-primary/70" />
        <span className="text-[8px] font-black text-brand-primary/70 uppercase tracking-widest">{template.layout}</span>
      </div>
    </div>
  );
};

export default function ResumeBuilder() {
  const [step, setStep] = useState(0); // 0: Template, 1: Personal, 2: Experience, 3: Education, 4: Skills, 5: Review
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [careerLevel, setCareerLevel] = useState<'Entry' | 'Mid' | 'Senior'>('Mid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [jdText, setJdText] = useState('');
  const [optimizationResult, setOptimizationResult] = useState<{ missingKeywords: string[], suggestions: string } | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    personal: { name: '', email: '', phone: '', location: '', linkedin: '', summary: '' },
    experience: [{ role: '', company: '', dates: '', description: '' }],
    education: [{ degree: '', institution: '', year: '' }],
    skills: '',
    certifications: ''
  });

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, personal: { ...formData.personal, [e.target.name]: e.target.value } });
  };

  const addExperience = () => {
    setFormData({ ...formData, experience: [...formData.experience, { role: '', company: '', dates: '', description: '' }] });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const newExp = [...formData.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setFormData({ ...formData, experience: newExp });
  };

  const addEducation = () => {
    setFormData({ ...formData, education: [...formData.education, { degree: '', institution: '', year: '' }] });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newEdu = [...formData.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setFormData({ ...formData, education: newEdu });
  };

  const generateAISummary = async () => {
    if (isGeneratingSummary) return;
    setIsGeneratingSummary(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Career Level: ${careerLevel}\nWork Experience: ${JSON.stringify(formData.experience)}\nSkills: ${formData.skills}\n\nGenerate a cohesive, professional 2-3 sentence professional summary for a resume based on the career level, experience and skills provided. Focus on impact and key competencies.`,
        config: {
          systemInstruction: "You are a world-class resume writer. Output only the summary text, no preamble or quotes.",
          temperature: 0.7
        }
      });

      if (response.text) {
        setFormData(prev => ({
          ...prev,
          personal: { ...prev.personal, summary: response.text.trim() }
        }));
        toast.success("Professional summary generated!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const polishExperience = async () => {
    if (isPolishing) return;
    setIsPolishing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Experience Data: ${JSON.stringify(formData.experience)}\n\nPolish these experience descriptions. Replace weak verbs with powerful action verbs (e.g., 'worked on' to 'spearheaded', 'helped' to 'orchestrated'). Ensure a consistent professional tone and focus on measurable impact.`,
        config: {
          systemInstruction: "You are a world-class resume editor. Output strictly as a JSON array of objects with 'role', 'company', 'dates', and 'description' fields.",
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const polished = JSON.parse(response.text);
        setFormData(prev => ({ ...prev, experience: polished }));
        toast.success("Experience polished with action verbs!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to polish experience.");
    } finally {
      setIsPolishing(false);
    }
  };

  const optimizeKeywords = async () => {
    if (!jdText.trim()) {
      toast.error("Please provide a job description first.");
      return;
    }
    setIsOptimizing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Resume Data: ${JSON.stringify(formData)}\nJob Description: ${jdText}\n\nAnalyze the resume against the job description. Identify missing industry-standard keywords and provide 3-5 specific suggestions to improve ATS compatibility.`,
        config: {
          systemInstruction: "You are an ATS optimization expert. Output strictly as JSON with 'missingKeywords' (array) and 'suggestions' (string) fields.",
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        setOptimizationResult(JSON.parse(response.text));
        toast.success("ATS optimization analysis complete!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to optimize keywords.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsGenerating(true);

    try {
      // Use AI to polish the summary and descriptions for high ATS score
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User Data: ${JSON.stringify(formData)}\nTemplate Style: ${selectedTemplate}\n\nGenerate a professional, high-ATS-score resume in JSON format. Polish the summary and experience descriptions to be impact-driven and use action verbs. Adapt the tone to the ${selectedTemplate} style while maintaining strict ATS compatibility. Use standard fonts like Arial or Calibri in the conceptual layout.`,
        config: {
          systemInstruction: "You are a world-class resume writer. Output strictly as JSON matching the app's internal ResumeResult schema (Name, Contact, Summary, Education, Experience, Skills, Projects, Certifications).",
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          mainResumeText: response.text,
          mainResumeName: `${formData.personal.name || 'My'}_Resume.pdf`
        });
        toast.success("Resume generated successfully!");
        setShowSuccessOverlay(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary p-4 sm:p-8 lg:p-12 flex flex-col items-center custom-scrollbar overflow-y-auto">
      <div className="w-full max-w-4xl">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center shadow-2xl border border-brand-accent/20">
              <Sparkles className="w-7 h-7 text-brand-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase font-display">Resume Builder</h1>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.3em]">Step {step + 1} of 6</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/onboarding')}
            className="text-[10px] font-black text-brand-muted hover:text-brand-primary uppercase tracking-widest transition-colors border border-border-subtle px-4 py-2 rounded-full hover:bg-bg-card"
          >
            Cancel
          </button>
        </header>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-bg-card border border-border-subtle rounded-full mb-16 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / 6) * 100}%` }}
            className="h-full bg-brand-accent shadow-[0_0_20px_rgba(197,160,89,0.4)]"
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <h2 className="text-5xl font-black tracking-tighter uppercase mb-4 font-display">Choose Your Template</h2>
                <p className="text-brand-muted max-w-lg mx-auto font-medium tracking-wide">Select a high-ATS-score template to start your professional journey.</p>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                      selectedCategory === cat 
                        ? 'bg-brand-primary text-bg-deep shadow-xl scale-105' 
                        : 'bg-bg-card/50 text-brand-muted border border-border-subtle hover:border-brand-accent/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {TEMPLATES.filter(t => selectedCategory === 'All' || t.category === selectedCategory).map(t => (
                  <div 
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-6 rounded-[3rem] border transition-all duration-700 cursor-pointer group relative overflow-hidden ${
                      selectedTemplate === t.id 
                        ? 'border-brand-accent bg-brand-accent/5 shadow-2xl' 
                        : 'border-border-subtle bg-bg-card/20 hover:border-brand-accent/30'
                    }`}
                  >
                    <div className="w-full h-56 rounded-[2rem] mb-6 overflow-hidden relative group-hover:scale-[1.02] transition-transform duration-700 border border-border-subtle shadow-inner">
                      <MiniResumePreview template={t} />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/40 to-transparent pointer-events-none" />
                    </div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-black text-brand-primary uppercase tracking-tight font-display">{t.name}</h3>
                      <span className="text-[8px] font-black px-2 py-1 rounded-full bg-bg-card border border-border-subtle text-brand-muted uppercase tracking-widest">{t.category}</span>
                    </div>
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-[0.15em] leading-relaxed">{t.desc}</p>
                    {selectedTemplate === t.id && (
                      <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center shadow-2xl z-20 border-2 border-bg-deep">
                        <CheckCircle2 className="w-5 h-5 text-bg-deep" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-12">
                <button onClick={nextStep} className="bg-brand-primary text-bg-deep px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.3em] flex items-center gap-4 hover:opacity-90 transition-all shadow-2xl hover:shadow-brand-primary/20">
                  Next Step <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <h2 className="text-5xl font-black tracking-tighter uppercase mb-4 font-display">Personal Details</h2>
                <p className="text-brand-muted max-w-lg mx-auto font-medium tracking-wide">How should recruiters contact you?</p>
              </div>
              <div className="bg-bg-card/30 border border-border-subtle p-12 rounded-[3.5rem] backdrop-blur-xl space-y-10 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted ml-1">Full Name</label>
                    <input name="name" value={formData.personal.name} onChange={handlePersonalChange} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-6 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all shadow-inner" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted ml-1">Email Address</label>
                    <input name="email" value={formData.personal.email} onChange={handlePersonalChange} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-6 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all shadow-inner" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted ml-1">Phone Number</label>
                    <input name="phone" value={formData.personal.phone} onChange={handlePersonalChange} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-6 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all shadow-inner" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted ml-1">Location (City, Country)</label>
                    <input name="location" value={formData.personal.location} onChange={handlePersonalChange} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-6 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all shadow-inner" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted ml-1">Career Level</label>
                  <div className="flex gap-6">
                    {['Entry', 'Mid', 'Senior'].map(level => (
                      <button
                        key={level}
                        onClick={() => setCareerLevel(level as any)}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
                          careerLevel === level 
                            ? 'bg-brand-accent text-bg-deep shadow-xl scale-[1.02]' 
                            : 'bg-bg-deep border border-border-subtle text-brand-muted hover:border-brand-accent/50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 relative">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">Professional Summary</label>
                    <button 
                      onClick={generateAISummary}
                      disabled={isGeneratingSummary}
                      className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-accent hover:text-brand-primary transition-colors disabled:opacity-50"
                    >
                      {isGeneratingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI Generate
                    </button>
                  </div>
                  <textarea name="summary" rows={5} value={formData.personal.summary} onChange={handlePersonalChange} className="w-full bg-bg-deep border border-border-subtle rounded-3xl p-6 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all resize-none shadow-inner leading-relaxed" placeholder="Briefly describe your professional background and goals..." />
                </div>
              </div>
              <div className="flex justify-between pt-12">
                <button onClick={prevStep} className="text-brand-muted hover:text-brand-primary font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-4 transition-all border border-border-subtle px-8 py-4 rounded-full hover:bg-bg-card">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={nextStep} className="bg-brand-primary text-bg-deep px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.3em] flex items-center gap-4 hover:opacity-90 transition-all shadow-2xl hover:shadow-brand-primary/20">
                  Next Step <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end mb-12">
                <div className="text-left">
                  <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Work Experience</h2>
                  <p className="text-brand-muted max-w-lg font-medium">List your professional journey.</p>
                </div>
                <button 
                  onClick={polishExperience}
                  disabled={isPolishing}
                  className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-brand-accent/20 transition-all disabled:opacity-50"
                >
                  {isPolishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Professional Polish
                </button>
              </div>
              <div className="space-y-6">
                {formData.experience.map((exp, i) => (
                  <div key={i} className="bg-bg-card/30 border border-border-subtle p-10 rounded-[2.5rem] backdrop-blur-xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Role / Title</label>
                        <input value={exp.role} onChange={e => updateExperience(i, 'role', e.target.value)} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Company</label>
                        <input value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Dates (e.g. Jan 2020 - Present)</label>
                      <input value={exp.dates} onChange={e => updateExperience(i, 'dates', e.target.value)} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Description / Achievements</label>
                      <textarea rows={4} value={exp.description} onChange={e => updateExperience(i, 'description', e.target.value)} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all resize-none" />
                    </div>
                  </div>
                ))}
                <button onClick={addExperience} className="w-full py-6 rounded-[2rem] border border-dashed border-brand-accent/30 bg-brand-accent/5 text-brand-accent font-black text-sm uppercase tracking-widest hover:bg-brand-accent/10 transition-all">
                  + Add Experience
                </button>
              </div>
              <div className="flex justify-between pt-8">
                <button onClick={prevStep} className="text-brand-muted hover:text-brand-primary font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={nextStep} className="bg-brand-primary text-bg-deep px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl">
                  Next Step <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Education</h2>
                <p className="text-brand-muted max-w-lg mx-auto font-medium">Where did you study?</p>
              </div>
              <div className="space-y-6">
                {formData.education.map((edu, i) => (
                  <div key={i} className="bg-bg-card/30 border border-border-subtle p-10 rounded-[2.5rem] backdrop-blur-xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Degree / Certification</label>
                        <input value={edu.degree} onChange={e => updateEducation(i, 'degree', e.target.value)} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Institution</label>
                        <input value={edu.institution} onChange={e => updateEducation(i, 'institution', e.target.value)} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Year of Graduation</label>
                      <input value={edu.year} onChange={e => updateEducation(i, 'year', e.target.value)} className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all" />
                    </div>
                  </div>
                ))}
                <button onClick={addEducation} className="w-full py-6 rounded-[2rem] border border-dashed border-brand-accent/30 bg-brand-accent/5 text-brand-accent font-black text-sm uppercase tracking-widest hover:bg-brand-accent/10 transition-all">
                  + Add Education
                </button>
              </div>
              <div className="flex justify-between pt-8">
                <button onClick={prevStep} className="text-brand-muted hover:text-brand-primary font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={nextStep} className="bg-brand-primary text-bg-deep px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl">
                  Next Step <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Skills & Optimization</h2>
                <p className="text-brand-muted max-w-lg mx-auto font-medium">What are your core competencies?</p>
              </div>
              
              <div className="bg-bg-card/30 border border-border-subtle p-10 rounded-[2.5rem] backdrop-blur-xl space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Skills (Comma separated)</label>
                  <textarea rows={4} value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, TypeScript, Node.js, AWS, Project Management..." className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Certifications (Optional)</label>
                  <textarea rows={4} value={formData.certifications} onChange={e => setFormData({...formData, certifications: e.target.value})} placeholder="AWS Certified Solutions Architect, PMP..." className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all resize-none" />
                </div>

                {/* Keyword Optimization Section */}
                <div className="pt-8 border-t border-border-subtle space-y-6">
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-brand-accent" />
                    <h3 className="text-lg font-black text-brand-primary uppercase tracking-tight">ATS Keyword Optimization</h3>
                  </div>
                  <p className="text-sm text-brand-muted font-medium">Paste the job description below to analyze missing industry-standard keywords.</p>
                  <textarea 
                    rows={6} 
                    value={jdText} 
                    onChange={e => setJdText(e.target.value)} 
                    placeholder="Paste job description here..." 
                    className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-5 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all resize-none" 
                  />
                  <button 
                    onClick={optimizeKeywords}
                    disabled={isOptimizing}
                    className="w-full py-4 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Analyze Keywords
                  </button>

                  {optimizationResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl bg-brand-accent/5 border border-brand-accent/20 space-y-4"
                    >
                      <div className="flex items-center gap-2 text-brand-accent">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Analysis Complete</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Missing Keywords:</p>
                        <div className="flex flex-wrap gap-2">
                          {optimizationResult.missingKeywords.map((kw, i) => (
                            <span key={i} className="px-3 py-1 rounded-lg bg-bg-deep border border-border-subtle text-[10px] font-bold text-brand-primary">{kw}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Suggestions:</p>
                        <p className="text-sm text-brand-muted leading-relaxed italic">{optimizationResult.suggestions}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="flex justify-between pt-8">
                <button onClick={prevStep} className="text-brand-muted hover:text-brand-primary font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button onClick={nextStep} className="bg-brand-primary text-bg-deep px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all shadow-xl">
                  Review Resume <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Review & Generate</h2>
                <p className="text-brand-muted max-w-lg mx-auto font-medium">Ready to create your AI-powered master resume?</p>
              </div>
              
              <div className="bg-bg-card/30 border border-border-subtle p-10 rounded-[2.5rem] backdrop-blur-xl space-y-12">
                <div className="flex items-center gap-6 pb-8 border-b border-border-subtle">
                  <div className="w-20 h-20 rounded-3xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                    <User className="w-10 h-10 text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-brand-primary uppercase tracking-tight">{formData.personal.name || 'Your Name'}</h3>
                    <p className="text-sm text-brand-muted font-bold uppercase tracking-widest">{formData.personal.email || 'Email not provided'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] flex items-center gap-3">
                      <Briefcase className="w-4 h-4" /> Experience
                    </h4>
                    <div className="space-y-4">
                      {formData.experience.map((exp, i) => (
                        <div key={i} className="pl-4 border-l-2 border-brand-accent/20">
                          <p className="text-sm font-black text-brand-primary uppercase">{exp.role}</p>
                          <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{exp.company}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] flex items-center gap-3">
                      <GraduationCap className="w-4 h-4" /> Education
                    </h4>
                    <div className="space-y-4">
                      {formData.education.map((edu, i) => (
                        <div key={i} className="pl-4 border-l-2 border-purple-500/20">
                          <p className="text-sm font-black text-brand-primary uppercase">{edu.degree}</p>
                          <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{edu.institution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button onClick={prevStep} className="text-brand-muted hover:text-brand-primary font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all">
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isGenerating}
                  className="bg-brand-primary text-bg-deep px-12 py-6 rounded-full font-black text-lg uppercase tracking-widest flex items-center gap-4 hover:opacity-90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  {isGenerating ? 'Synthesizing...' : 'Generate Master Resume'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Overlay */}
        <AnimatePresence>
          {showSuccessOverlay && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl bg-bg-card border border-border-subtle rounded-[3rem] p-12 text-center shadow-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black text-brand-primary uppercase tracking-tighter mb-6">Resume Ready!</h2>
                <div className="space-y-6 mb-10">
                  <div className="p-6 rounded-2xl bg-brand-accent/5 border border-brand-accent/20 text-left">
                    <div className="flex items-start gap-4">
                      <Info className="w-6 h-6 text-brand-accent shrink-0 mt-1" />
                      <p className="text-brand-muted font-medium leading-relaxed">
                        Your professional base is ready. Please open the downloaded PDF to perform final manual adjustments or personalized content additions.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-brand-muted font-medium italic">
                    Tip: Check your "Downloads" folder for the file.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      // Trigger actual download here if needed
                      setShowSuccessOverlay(false);
                      navigate('/dashboard');
                    }}
                    className="flex-1 bg-brand-primary text-bg-deep py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 bg-bg-card border border-border-subtle text-brand-primary py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-bg-card/80 transition-all"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="mt-24 pt-12 border-t border-border-subtle text-center flex flex-col gap-4">
          <p className="text-[10px] font-black text-brand-muted/20 uppercase tracking-[0.4em]">
            KARYA LEKHA ™ • AI CAREER INTELLIGENCE
          </p>
          <p className="text-[7px] font-bold text-brand-muted/5 uppercase tracking-widest">
            SUPPORT: <a href="mailto:junnurimohankarthikeya@gmail.com" className="text-brand-accent/40 hover:text-brand-accent transition-colors">JUNNURIMOHANKARTHIKEYA@GMAIL.COM</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
