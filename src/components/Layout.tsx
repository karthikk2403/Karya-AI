import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, FileText, Briefcase, MessageSquare, LineChart, Zap, LogOut, Settings, Target, DollarSign, Linkedin, LayoutDashboard, Users, Compass, Crown, ShieldAlert, ChevronLeft, ChevronRight, HelpCircle, Shield, Lock, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import FeedbackModal from './FeedbackModal';
import Logo from './Logo';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);

  React.useEffect(() => {
    // Default to collapsed for professional workspace feel
    setIsSidebarCollapsed(true);
  }, [location.pathname]);
  const [announcement, setAnnouncement] = React.useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Check if user is banned
        const userRef = doc(db, 'users', user.uid);
        const unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().isBanned) {
            toast.error("Your account has been terminated for violating our terms of service.", {
              duration: 10000,
              description: "Please contact support if you believe this is a mistake."
            });
            auth.signOut();
            navigate('/');
          }
        });

        // Fetch announcement
        const announcementRef = doc(db, 'system_announcements', 'global');
        const unsubAnnouncement = onSnapshot(announcementRef, (docSnap) => {
          if (docSnap.exists()) {
            setAnnouncement(docSnap.data().text || null);
          } else {
            setAnnouncement(null);
          }
        });

        return () => {
          if (unsubUser) unsubUser();
          if (unsubAnnouncement) unsubAnnouncement();
        };
      }
    });
    return () => {
      unsubscribeAuth();
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Tailor Resume', icon: <Target className="w-5 h-5" /> },
    { path: '/guide', label: 'How to Use', icon: <HelpCircle className="w-5 h-5" /> },
    { path: '/wallet', label: 'My Wallet', icon: <DollarSign className="w-5 h-5" /> },
    { path: '/tracker', label: 'Job Tracker', icon: <Briefcase className="w-5 h-5" /> },
    { path: '/resumes', label: 'My Resumes', icon: <FileText className="w-5 h-5" /> },
    { path: '/resume-builder', label: 'Resume Builder', icon: <FileText className="w-5 h-5" /> },
    { path: '/interview', label: 'Interview Prep', icon: <MessageSquare className="w-5 h-5" /> },
    { path: '/career-predictor', label: 'Career Predictor', icon: <Compass className="w-5 h-5" /> },
  ];

  const marketingNav = [
    { path: '/features', label: 'Features' },
    { path: '/about', label: 'About' },
    { path: '/enterprise', label: 'Enterprise' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/contact', label: 'Contact' },
  ];

  const isAdmin = auth.currentUser?.email === 'mkarthikeya24@gmail.com' || auth.currentUser?.email === 'Kbsn1170@gmail.com';

  return (
    <div className="min-h-screen bg-bg-deep text-brand-primary font-sans selection:bg-brand-accent/30 selection:text-brand-accent flex flex-col overflow-hidden">
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      
      <AnimatePresence>
        {announcement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-brand-accent text-bg-deep px-6 py-1.5 flex items-center justify-center gap-3 relative z-[110] overflow-hidden"
          >
            <Zap className="w-3 h-3 text-bg-deep animate-pulse shrink-0" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center">
              {announcement}
            </p>
            <button 
              onClick={() => setAnnouncement(null)}
              className="absolute right-6 text-bg-deep/60 hover:text-bg-deep transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Header (Persistent) */}
      <header className={cn(
        "fixed left-0 right-0 z-[100] border-b border-border-subtle bg-bg-glass/90 backdrop-blur-xl px-6 lg:px-12 py-3 flex items-center justify-between transition-all duration-300",
        announcement ? "top-[33px]" : "top-0"
      )}>
        <div className="flex items-center gap-12">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo size="md" />
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {marketingNav.map(item => (
              <Link key={item.path} to={item.path} className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition-colors">{item.label}</Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="flex items-center px-8 py-2.5 rounded-full bg-brand-primary text-bg-deep text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
          >
            DASHBOARD
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="lg:hidden p-2 text-brand-primary"
          >
            <div className="space-y-1.5">
              <div className="w-6 h-0.5 bg-brand-accent rounded-full" />
              <div className="w-4 h-0.5 bg-brand-accent rounded-full ml-auto" />
              <div className="w-6 h-0.5 bg-brand-accent rounded-full" />
            </div>
          </button>
        </div>
      </header>

      <div className={cn("flex flex-1 transition-all duration-300", announcement ? "pt-[97px]" : "pt-[64px]")}>
        {/* Sidebar (Internal Navigation) */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarCollapsed ? 64 : 240 }}
          className="hidden lg:flex border-r border-border-subtle bg-bg-surface/50 flex-col sticky h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar overflow-x-hidden"
        >
          <div className={cn("flex flex-col h-full", isSidebarCollapsed ? "items-center py-6" : "p-6")}>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="mb-8 p-2 rounded-lg bg-bg-card border border-border-subtle text-brand-muted hover:text-brand-accent transition-all shadow-sm flex items-center justify-center w-8 h-8 mx-auto"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="space-y-6 flex-1 w-full">
              <div className="space-y-1">
                {!isSidebarCollapsed && (
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-muted/40 px-4 mb-2 block">Workspace</span>
                )}
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                          isActive 
                            ? 'bg-bg-card text-brand-primary border border-border-subtle shadow-sm' 
                            : 'text-brand-muted hover:bg-bg-card/50 hover:text-brand-primary',
                          isSidebarCollapsed && "justify-center px-0 w-10 h-10 mx-auto"
                        )}
                        title={isSidebarCollapsed ? item.label : ""}
                      >
                        <div className={cn(
                          "transition-colors shrink-0",
                          isActive ? 'text-brand-accent' : 'text-brand-muted/40 group-hover:text-brand-muted'
                        )}>
                          {React.cloneElement(item.icon as React.ReactElement, { className: "w-4 h-4" })}
                        </div>
                        {!isSidebarCollapsed && (
                          <span className="font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">{item.label}</span>
                        )}
                        {isSidebarCollapsed && isActive && (
                          <motion.div 
                            layoutId="active-indicator"
                            className="absolute left-0 w-0.5 h-4 bg-brand-accent rounded-r-full"
                          />
                        )}
                      </Link>
                    );
                  })}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                        location.pathname === '/admin'
                          ? 'bg-bg-card text-brand-primary border border-border-subtle shadow-sm'
                          : 'text-brand-muted hover:bg-bg-card/50 hover:text-brand-primary',
                        isSidebarCollapsed && "justify-center px-0 w-10 h-10 mx-auto"
                      )}
                      title={isSidebarCollapsed ? "Admin Panel" : ""}
                    >
                      <div className={cn(
                        "transition-colors shrink-0",
                        location.pathname === '/admin' ? 'text-red-500' : 'text-brand-muted/40 group-hover:text-red-500'
                      )}>
                        <Shield className="w-4 h-4" />
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">Admin Panel</span>
                      )}
                    </Link>
                  )}
                </nav>
              </div>

              <div className="space-y-1">
                {!isSidebarCollapsed && (
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-muted/40 px-4 mb-2 block">Support</span>
                )}
                <div className="space-y-1">
                  <button 
                    onClick={() => setIsFeedbackOpen(true)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-muted hover:bg-bg-card/50 hover:text-brand-primary transition-all w-full text-left group",
                      isSidebarCollapsed && "justify-center px-0 w-10 h-10 mx-auto"
                    )}
                    title={isSidebarCollapsed ? "Feedback" : ""}
                  >
                    <MessageCircle className="w-4 h-4 text-brand-muted/40 group-hover:text-brand-accent transition-colors" />
                    {!isSidebarCollapsed && <span className="font-bold text-[11px] uppercase tracking-wider">Feedback</span>}
                  </button>
                  <Link 
                    to="/settings" 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-muted hover:bg-bg-card/50 hover:text-brand-primary transition-all w-full text-left group",
                      isSidebarCollapsed && "justify-center px-0 w-10 h-10 mx-auto"
                    )}
                    title={isSidebarCollapsed ? "Settings" : ""}
                  >
                    <Settings className="w-4 h-4 text-brand-muted/40 group-hover:text-brand-primary transition-colors" />
                    {!isSidebarCollapsed && <span className="font-bold text-[11px] uppercase tracking-wider">Settings</span>}
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-muted hover:bg-red-500/5 hover:text-red-500 transition-all w-full text-left group",
                      isSidebarCollapsed && "justify-center px-0 w-10 h-10 mx-auto"
                    )}
                    title={isSidebarCollapsed ? "Sign Out" : ""}
                  >
                    <LogOut className="w-4 h-4 text-brand-muted/40 group-hover:text-red-500 transition-colors" />
                    {!isSidebarCollapsed && <span className="font-bold text-[11px] uppercase tracking-wider">Sign Out</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 h-[calc(100vh-64px)] overflow-y-auto relative z-10 flex flex-col bg-bg-surface custom-scrollbar">
          <AnimatePresence>
            {announcement && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-brand-accent/10 border-b border-brand-accent/20 px-6 py-3 flex items-center justify-center gap-3 relative z-50 backdrop-blur-md"
              >
                <Zap className="w-4 h-4 text-brand-accent animate-pulse shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent text-center">
                  {announcement}
                </p>
                <button 
                  onClick={() => setAnnouncement(null)}
                  className="absolute right-6 text-brand-accent/40 hover:text-brand-accent transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex-1 p-0">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[150] bg-bg-deep p-8 flex flex-col h-screen overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-12">
              <Logo size="lg" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-brand-primary">
                <X className="w-8 h-8" />
              </button>
            </div>
            <nav className="space-y-6">
              {[...marketingNav, ...navItems].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-2xl font-display font-bold uppercase tracking-tight text-brand-primary"
                >
                  {item.label}
                </Link>
              ))}
              <button onClick={handleLogout} className="block text-2xl font-display font-bold uppercase tracking-tight text-red-500">Sign Out</button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
