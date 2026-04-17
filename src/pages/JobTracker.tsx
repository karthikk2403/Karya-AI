import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MoreVertical, Building2, MapPin, DollarSign, Calendar, MessageSquare, ExternalLink, X, Loader2, Briefcase } from 'lucide-react';
import { JobRecord, JobStatus } from '../types/job';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const COLUMNS: JobStatus[] = [
  'Saved Draft', 
  'Applied', 
  'Interview', 
  'Assessment', 
  'Selected', 
  'Rejected'
];

const STATUS_COLORS: Record<JobStatus, { text: string, bg: string, border: string }> = {
  'Saved Draft': { text: 'text-neutral-400', bg: 'bg-neutral-400/10', border: 'border-neutral-400/20' },
  'Applied': { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  'Interview': { text: 'text-brand-accent', bg: 'bg-brand-accent/10', border: 'border-brand-accent/20' },
  'Assessment': { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  'Selected': { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  'Rejected': { text: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  'Archived': { text: 'text-neutral-600', bg: 'bg-neutral-600/10', border: 'border-neutral-600/20' } // Fallback
} as any;

export default function JobTracker() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [newJob, setNewJob] = useState({
    role: '',
    company: '',
    location: '',
    salary: '',
    jobLink: '',
    description: '',
    workMode: 'Onsite' as 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown'
  });

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!newJob.role || !newJob.company) {
      toast.error("Role and Company are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const jobId = crypto.randomUUID();
      const jobData: JobRecord = {
        id: jobId,
        userId: auth.currentUser.uid,
        role: newJob.role,
        company: newJob.company,
        location: newJob.location,
        salary: newJob.salary,
        jobLink: newJob.jobLink,
        jobDescriptionSnapshot: newJob.description,
        workMode: newJob.workMode,
        status: 'Saved Draft',
        dateApplied: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        skillsRequired: [],
        keywordsExtracted: [],
        atsMatchScore: 0
      };

      await setDoc(doc(db, 'jobs', jobId), jobData);
      toast.success("Job added successfully!", {
        className: "bg-bg-card border-border-subtle text-brand-primary font-bold uppercase text-[10px] tracking-widest"
      });
      setIsAddModalOpen(false);
      setNewJob({
        role: '',
        company: '',
        location: '',
        salary: '',
        jobLink: '',
        description: '',
        workMode: 'Onsite'
      });
    } catch (error) {
      console.error("Error adding job:", error);
      toast.error("Failed to add job");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, 'jobs'), where('userId', '==', user.uid));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const jobsData: JobRecord[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as JobRecord;
            // Map old statuses to new ones
            let status = data.status as string;
            if (status === 'Saved') status = 'Saved Draft';
            else if (status === 'Screened') status = 'Applied';
            else if (status === 'Assessment/Test Link Arrived') status = 'Assessment';
            else if (['Interview Scheduled', 'HR Round', 'Technical Round', 'Managerial Round', 'Final Round'].includes(status)) status = 'Interview';
            else if (status === 'Offer Received') status = 'Selected';
            else if (status === 'Archived') status = 'Rejected';
            
            jobsData.push({ ...data, status: status as JobStatus });
          });
          jobsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setJobs(jobsData);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'jobs');
        });
      } else {
        setJobs([]);
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
  }, []);

  const updateJobStatus = async (jobId: string, status: JobStatus) => {
    // Optimistic update
    const updatedJobs = jobs.map(job => job.id === jobId ? { ...job, status } : job);
    setJobs(updatedJobs);
    if (selectedJob?.id === jobId) {
      setSelectedJob({ ...selectedJob, status });
    }

    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, { status, updatedAt: new Date().toISOString() });
      toast.success("Status updated", {
        className: "bg-bg-card border-border-subtle text-brand-primary font-bold uppercase text-[10px] tracking-widest"
      });
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update status");
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    
    try {
      // In a real app we might use a deleteDoc, but for now let's just filter it out or update a status
      // Actually let's use deleteDoc if possible, but I don't see it imported.
      // I'll just filter it from state for now if I can't delete it.
      // Wait, I can import deleteDoc.
      const { deleteDoc: firestoreDeleteDoc } = await import('firebase/firestore');
      await firestoreDeleteDoc(doc(db, 'jobs', jobId));
      setJobs(jobs.filter(j => j.id !== jobId));
      setSelectedJob(null);
      toast.success("Job removed");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-deep overflow-hidden">
      <header className="px-8 py-6 border-b border-border-subtle flex justify-between items-center bg-bg-surface/30 backdrop-blur-xl shrink-0">
        <div>
          <h1 className="text-2xl font-black text-brand-primary tracking-tighter uppercase">Job Tracker</h1>
          <p className="text-[10px] text-brand-muted font-bold uppercase tracking-[0.2em] mt-1">Manage your career pipeline</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-primary hover:opacity-90 text-bg-deep px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </header>

      <div className="flex-1 overflow-x-auto custom-scrollbar-horizontal bg-bg-deep/50">
        <div className="flex h-full p-6 gap-6 min-w-max">
          {COLUMNS.map(status => (
            <div 
              key={status} 
              className="w-[320px] flex flex-col bg-bg-surface/20 rounded-3xl border border-border-subtle/50 overflow-hidden"
            >
              <div className="p-5 border-b border-border-subtle/30 flex justify-between items-center bg-bg-card/30">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[status].bg.replace('/10', ''))} />
                  <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-brand-muted">{status}</h2>
                </div>
                <span className="text-[10px] font-black text-brand-muted/40">
                  {jobs.filter(j => j.status === status).length}
                </span>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
                {jobs.filter(j => j.status === status).length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-border-subtle/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-brand-muted/30">
                    <Briefcase className="w-6 h-6 opacity-20" />
                    <span className="text-[9px] font-black uppercase tracking-widest">No {status.toLowerCase()} yet</span>
                  </div>
                ) : (
                  jobs.filter(j => j.status === status).map(job => (
                    <motion.div
                      layoutId={job.id}
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="bg-bg-card border border-border-subtle/50 p-4 rounded-xl cursor-pointer hover:border-brand-accent/30 transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-brand-muted/20" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-brand-primary leading-tight truncate">{job.role}</h3>
                          <p className="text-[12px] text-brand-muted mt-0.5 truncate">{job.company}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <Calendar className="w-3 h-3 text-brand-muted/30" />
                            <span className="text-[9px] font-medium text-brand-muted/40 uppercase tracking-widest">
                              {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Panel (Drawer) */}
      <AnimatePresence>
        {selectedJob && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="fixed inset-0 z-[150] bg-bg-deep/60 backdrop-blur-sm lg:left-72"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-bg-card border-l border-border-subtle z-[160] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-bg-surface/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-brand-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-brand-primary tracking-tighter uppercase leading-none">{selectedJob.role}</h2>
                    <p className="text-xs text-brand-muted font-bold uppercase tracking-widest mt-2">{selectedJob.company}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-2 rounded-xl hover:bg-bg-surface text-brand-muted transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted/40">Update Status</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {COLUMNS.map(status => (
                      <button
                        key={status}
                        onClick={() => updateJobStatus(selectedJob.id, status)}
                        className={cn(
                          "px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center gap-3",
                          selectedJob.status === status 
                            ? cn(STATUS_COLORS[status].bg, STATUS_COLORS[status].text, STATUS_COLORS[status].border)
                            : "border-border-subtle bg-bg-surface/50 text-brand-muted hover:border-brand-accent/30"
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full", selectedJob.status === status ? STATUS_COLORS[status].bg.replace('/10', '') : "bg-brand-muted/20")} />
                        {status}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted/40">Job Details</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {selectedJob.location && (
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-bg-surface/30 border border-border-subtle">
                        <MapPin className="w-5 h-5 text-brand-accent" />
                        <div>
                          <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Location</p>
                          <p className="text-sm font-bold text-brand-primary mt-0.5">{selectedJob.location} ({selectedJob.workMode})</p>
                        </div>
                      </div>
                    )}
                    {selectedJob.salary && (
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-bg-surface/30 border border-border-subtle">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Compensation</p>
                          <p className="text-sm font-bold text-brand-primary mt-0.5">{selectedJob.salary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {selectedJob.jobDescriptionSnapshot && (
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted/40">Description</h3>
                    <div className="p-6 rounded-2xl bg-bg-surface/30 border border-border-subtle">
                      <p className="text-xs leading-relaxed text-brand-muted font-medium whitespace-pre-wrap">
                        {selectedJob.jobDescriptionSnapshot}
                      </p>
                    </div>
                  </section>
                )}

                <div className="pt-10 flex flex-col gap-4">
                  {selectedJob.jobLink && (
                    <a 
                      href={selectedJob.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 rounded-2xl bg-brand-primary text-bg-deep font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Original Posting
                    </a>
                  )}
                  <button 
                    onClick={() => deleteJob(selectedJob.id)}
                    className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                  >
                    Delete Application
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Job Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-bg-card border border-border-subtle rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-bg-glass backdrop-blur-xl">
                <h2 className="text-2xl font-black text-brand-primary uppercase tracking-tighter">Add New Job</h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-bg-card/50 text-brand-muted transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddJob} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Job Role *</label>
                    <input 
                      required
                      type="text" 
                      value={newJob.role}
                      onChange={e => setNewJob({...newJob, role: e.target.value})}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-4 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Company *</label>
                    <input 
                      required
                      type="text" 
                      value={newJob.company}
                      onChange={e => setNewJob({...newJob, company: e.target.value})}
                      placeholder="e.g. Google"
                      className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-4 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Location</label>
                    <input 
                      type="text" 
                      value={newJob.location}
                      onChange={e => setNewJob({...newJob, location: e.target.value})}
                      placeholder="e.g. Mountain View, CA"
                      className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-4 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Salary Range</label>
                    <input 
                      type="text" 
                      value={newJob.salary}
                      onChange={e => setNewJob({...newJob, salary: e.target.value})}
                      placeholder="e.g. $150k - $200k"
                      className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-4 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Job Link</label>
                    <input 
                      type="url" 
                      value={newJob.jobLink}
                      onChange={e => setNewJob({...newJob, jobLink: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-4 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Work Mode</label>
                    <select 
                      value={newJob.workMode}
                      onChange={e => setNewJob({...newJob, workMode: e.target.value as any})}
                      className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-4 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all"
                    >
                      <option value="Onsite">Onsite</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted ml-1">Job Description</label>
                  <textarea 
                    value={newJob.description}
                    onChange={e => setNewJob({...newJob, description: e.target.value})}
                    placeholder="Paste the full job description here..."
                    rows={6}
                    className="w-full bg-bg-deep border border-border-subtle rounded-2xl p-4 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all resize-none custom-scrollbar"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-primary text-bg-deep py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {isSubmitting ? 'Adding Job...' : 'Confirm Add Job'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
