import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, Eye, Trash2, Search, Briefcase, Calendar, Target, Loader2, Filter, X, Info, AlertCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface ResumeRecord {
  id: string;
  userId: string;
  company: string;
  role: string;
  resumeText: string;
  atsScore: number;
  createdAt: string;
}

export default function Resumes() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResume, setSelectedResume] = useState<ResumeRecord | null>(null);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'resumeHistory'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ResumeRecord[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ResumeRecord);
      });
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setResumes(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'resumeHistory');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!resumeToDelete) return;
    try {
      await deleteDoc(doc(db, 'resumeHistory', resumeToDelete));
      toast.success('Resume deleted successfully');
      setResumeToDelete(null);
    } catch (err) {
      toast.error('Failed to delete resume');
    }
  };

  const downloadPdf = (resume: ResumeRecord) => {
    try {
      const doc = new jsPDF();
      const result = JSON.parse(resume.resumeText);
      
      let y = 20;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - margin * 2;

      const checkPageBreak = (height: number) => {
        if (y + height > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const addHeader = (title: string) => {
        checkPageBreak(15);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), margin, y);
        y += 2;
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      };

      const addText = (text: string, isBullet = false, isBold = false) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const bulletIndent = 5;
        const textWidth = isBullet ? maxLineWidth - bulletIndent : maxLineWidth;
        const lines = doc.splitTextToSize(text, textWidth);
        checkPageBreak(lines.length * 5);
        lines.forEach((line: string, index: number) => {
          if (isBullet && index === 0) {
            doc.text("•", margin, y);
            doc.text(line, margin + bulletIndent, y);
          } else {
            doc.text(line, isBullet ? margin + bulletIndent : margin, y);
          }
          y += 5;
        });
        y += 2;
      };

      // Watermark
      doc.setTextColor(240, 240, 240);
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
      doc.text("KARYA LEKHA", pageWidth / 2, doc.internal.pageSize.getHeight() / 2, { align: "center", angle: 45 });
      doc.restoreGraphicsState();
      doc.setTextColor(0, 0, 0);

      // Header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const name = result.Name || "";
      doc.text(name.toUpperCase(), pageWidth / 2, y, { align: "center" });
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const contact = (result.Contact || "").replace(/\|/g, ' • ');
      doc.text(contact, pageWidth / 2, y, { align: "center" });
      y += 12;

      if (result.Summary) {
        addHeader("Professional Summary");
        addText(result.Summary);
        y += 4;
      }

      if (result.Skills && Array.isArray(result.Skills)) {
        addHeader("Core Competencies");
        result.Skills.forEach((skillGroup: any) => {
          if (skillGroup.Category && skillGroup.Items) {
            addText(`${skillGroup.Category}: ${skillGroup.Items.join(' • ')}`, false, true);
          }
        });
        y += 4;
      }

      if (result.Experience && result.Experience.length > 0) {
        addHeader("Professional Experience");
        result.Experience.forEach((exp: any) => {
          checkPageBreak(25);
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const dates = exp.Dates || "";
          const datesWidth = doc.getTextWidth(dates);
          
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          const role = exp.Role || "";
          const maxRoleWidth = maxLineWidth - datesWidth - 5;
          const roleLines = doc.splitTextToSize(role, maxRoleWidth);
          
          doc.text(roleLines[0], margin, y);
          doc.text(dates, pageWidth - margin, y, { align: "right" });
          y += 5;
          
          if (roleLines.length > 1) {
            for(let i = 1; i < roleLines.length; i++) {
              doc.text(roleLines[i], margin, y);
              y += 5;
            }
          }
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.text(exp.Company || "", margin, y);
          y += 6;

          if (Array.isArray(exp.Description)) {
            exp.Description.forEach((bullet: string) => addText(bullet, true));
          } else if (exp.Description) {
            addText(exp.Description, true);
          }
          y += 3;
        });
      }

      if (result.Projects && result.Projects.length > 0) {
        addHeader("Strategic Projects");
        result.Projects.forEach((proj: any) => {
          checkPageBreak(12);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(proj.Name || "", margin, y);
          y += 6;

          if (Array.isArray(proj.Description)) {
            proj.Description.forEach((bullet: string) => addText(bullet, true));
          } else if (proj.Description) {
            proj.Description.split('\n').forEach((bullet: string) => addText(bullet, true));
          }
          y += 3;
        });
      }

      if (result.Education && result.Education.length > 0) {
        addHeader("Academic Foundation");
        result.Education.forEach((edu: any) => {
          checkPageBreak(10);
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const year = edu.Year || "";
          const yearWidth = doc.getTextWidth(year);
          
          const degreeText = `${edu.Degree}${edu.Institution ? `, ${edu.Institution}` : ''}`;
          const maxDegreeWidth = maxLineWidth - yearWidth - 5;
          const degreeLines = doc.splitTextToSize(degreeText, maxDegreeWidth);
          
          doc.text(degreeLines[0], margin, y);
          doc.text(year, pageWidth - margin, y, { align: "right" });
          y += 5;
          
          if (degreeLines.length > 1) {
            for(let i = 1; i < degreeLines.length; i++) {
              doc.text(degreeLines[i], margin, y);
              y += 5;
            }
          }
          y += 2;
        });
      }

      if (result.Certifications && result.Certifications.length > 0) {
        addHeader("Certifications");
        result.Certifications.forEach((cert: string) => {
          checkPageBreak(5);
          addText(cert, true);
        });
      }

      doc.save(`${resume.company}_Tailored_Resume.pdf`);
      toast.success('Resume downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF file.');
    }
  };

  const filteredResumes = resumes.filter(r => 
    r.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-12 bg-bg-deep min-h-screen">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black text-brand-primary tracking-tighter uppercase font-display">My Resumes</h1>
          <p className="text-brand-muted font-medium mt-2">Manage and download your tailored professional documents.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input 
            type="text"
            placeholder="Search by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-card/30 border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-sm text-brand-primary focus:border-brand-accent/50 outline-none transition-all"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-brand-accent animate-spin opacity-20" />
        </div>
      ) : filteredResumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResumes.map((resume) => (
            <motion.div 
              layout
              key={resume.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-bg-card/20 border border-border-subtle rounded-[2.5rem] p-8 hover:border-brand-accent/30 hover:bg-bg-card/40 transition-all duration-500 shadow-lg"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-bg-deep flex items-center justify-center border border-border-subtle group-hover:border-brand-accent/20 transition-all">
                  <FileText className="w-7 h-7 text-brand-muted group-hover:text-brand-accent transition-colors" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-[10px] font-black text-brand-accent uppercase tracking-widest">
                    {resume.atsScore}% Score
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-xl font-black text-brand-primary uppercase tracking-tight font-display truncate">{resume.company}</h3>
                <p className="text-xs text-brand-muted font-bold uppercase tracking-[0.2em]">{resume.role}</p>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-8 opacity-60">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(resume.createdAt).toLocaleDateString()}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => downloadPdf(resume)}
                  className="flex items-center justify-center gap-2 bg-brand-primary text-bg-deep py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button 
                  onClick={() => setSelectedResume(resume)}
                  className="flex items-center justify-center gap-2 bg-bg-card border border-border-subtle text-brand-primary py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-bg-card/80 transition-all"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
              </div>

              <button 
                onClick={() => setResumeToDelete(resume.id)}
                className="absolute top-8 right-8 p-2 text-brand-muted/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-border-subtle rounded-[3rem] bg-bg-card/5">
          <FileText className="w-16 h-16 text-brand-muted/10 mb-6" />
          <h2 className="text-xl font-black text-brand-primary uppercase tracking-widest mb-2">No Resumes Found</h2>
          <p className="text-brand-muted max-w-xs mx-auto">Start tailoring your resumes in the dashboard to see them here.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {resumeToDelete && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResumeToDelete(null)}
              className="absolute inset-0 bg-bg-deep/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-bg-card border border-border-subtle rounded-[2.5rem] p-10 text-center shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-brand-primary uppercase tracking-tight mb-4">Delete Resume?</h3>
              <p className="text-brand-muted font-medium mb-8">This action cannot be undone. The tailored profile will be permanently removed from your records.</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setResumeToDelete(null)}
                  className="py-4 rounded-2xl bg-bg-deep border border-border-subtle text-brand-primary font-black text-xs uppercase tracking-widest hover:bg-bg-card transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedResume && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResume(null)}
              className="absolute inset-0 bg-bg-deep/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white text-black rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">{selectedResume.company} - {selectedResume.role}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Generated on {new Date(selectedResume.createdAt).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedResume(null)}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 lg:p-16 custom-scrollbar-light font-serif bg-white relative">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden">
                  <span className="text-[12rem] font-black uppercase tracking-tighter -rotate-45 select-none whitespace-nowrap">KARYA LEKHA</span>
                </div>

                {(() => {
                  try {
                    const data = JSON.parse(selectedResume.resumeText);
                    return (
                      <div className="max-w-3xl mx-auto space-y-12 relative z-10">
                        <header className="text-center space-y-6">
                          <h1 className="text-5xl font-bold tracking-tighter uppercase">{data.Name}</h1>
                          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            {data.Contact?.split('|').map((item: string, i: number) => (
                              <span key={i} className="flex items-center gap-2">
                                {i > 0 && <span className="text-gray-300">•</span>}
                                {item.trim()}
                              </span>
                            ))}
                          </div>
                        </header>

                        {data.Summary && (
                          <section className="space-y-6">
                            <div className="flex items-center gap-6">
                              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 whitespace-nowrap">Professional Summary</h2>
                              <div className="h-px bg-gray-100 flex-1" />
                            </div>
                            <p className="text-[15px] leading-relaxed text-gray-800 text-justify">{data.Summary}</p>
                          </section>
                        )}

                        {data.Skills && (
                          <section className="space-y-6">
                            <div className="flex items-center gap-6">
                              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 whitespace-nowrap">Core Competencies</h2>
                              <div className="h-px bg-gray-100 flex-1" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                              {data.Skills.map((skillGroup: any, i: number) => (
                                <div key={i} className="space-y-2">
                                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{skillGroup.Category}</h3>
                                  <p className="text-[14px] text-gray-800 font-medium leading-relaxed">{skillGroup.Items?.join(' • ')}</p>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {data.Experience && (
                          <section className="space-y-8">
                            <div className="flex items-center gap-6">
                              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 whitespace-nowrap">Professional Trajectory</h2>
                              <div className="h-px bg-gray-100 flex-1" />
                            </div>
                            <div className="space-y-12">
                              {data.Experience.map((exp: any, i: number) => (
                                <div key={i} className="space-y-4">
                                  <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{exp.Role}</h3>
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{exp.Dates}</span>
                                  </div>
                                  <div className="text-xs font-black uppercase tracking-widest text-gray-500">{exp.Company}</div>
                                  <ul className="space-y-3">
                                    {exp.Description?.map((bullet: string, j: number) => (
                                      <li key={j} className="text-[14px] leading-relaxed text-gray-800 flex gap-4">
                                        <span className="text-gray-300 font-black mt-1.5 text-[10px]">■</span>
                                        <span className="flex-1 text-justify">{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {data.Projects && data.Projects.length > 0 && (
                          <section className="space-y-8">
                            <div className="flex items-center gap-6">
                              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 whitespace-nowrap">Strategic Initiatives</h2>
                              <div className="h-px bg-gray-100 flex-1" />
                            </div>
                            <div className="space-y-10">
                              {data.Projects.map((proj: any, i: number) => (
                                <div key={i} className="space-y-4">
                                  <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight">{proj.Name}</h3>
                                  <ul className="space-y-3">
                                    {(Array.isArray(proj.Description) ? proj.Description : proj.Description?.split('\n')).map((bullet: string, j: number) => (
                                      <li key={j} className="text-[14px] leading-relaxed text-gray-800 flex gap-4">
                                        <span className="text-gray-300 font-black mt-1.5 text-[10px]">■</span>
                                        <span className="flex-1 text-justify">{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {data.Education && (
                          <section className="space-y-8">
                            <div className="flex items-center gap-6">
                              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 whitespace-nowrap">Academic Foundation</h2>
                              <div className="h-px bg-gray-100 flex-1" />
                            </div>
                            <div className="space-y-8">
                              {data.Education.map((edu: any, i: number) => (
                                <div key={i} className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-2">
                                  <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">{edu.Degree}</h3>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{edu.Institution}</p>
                                  </div>
                                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{edu.Year}</span>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                      </div>
                    );
                  } catch (e) {
                    return (
                      <div className="flex flex-col items-center justify-center py-32 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500/20 mb-4" />
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Data Integrity Error</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-2">The stored resume data could not be parsed correctly.</p>
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
                <button 
                  onClick={() => setSelectedResume(null)}
                  className="px-8 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={() => downloadPdf(selectedResume)}
                  className="px-10 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-all shadow-lg"
                >
                  Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

