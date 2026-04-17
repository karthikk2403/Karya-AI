import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  Users, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  ShieldAlert, 
  Ban, 
  CheckCircle2, 
  Search,
  ArrowLeft,
  Loader2,
  Mail,
  Calendar,
  DollarSign,
  UserX,
  UserCheck,
  ChevronRight,
  Sparkles,
  Zap,
  Eye,
  X,
  Building2,
  Briefcase,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Plus,
  Minus,
  Activity,
  BarChart3,
  MessageCircle,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { JobRecord } from '../types/job';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
  isBanned?: boolean;
  photoURL?: string;
}

interface PaymentData {
  userId: string;
  amount: number;
  createdAt: string;
  type: string;
}

interface JobData extends JobRecord {}

interface ReviewData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string;
  message: string;
  rating: number;
  createdAt: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'announcements' | 'reviews'>('overview');
  const [walletAdjustment, setWalletAdjustment] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjustingWallet, setIsAdjustingWallet] = useState(false);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedUserBalance, setSelectedUserBalance] = useState<number | null>(null);
  const [isSendingWelcomeEmail, setIsSendingWelcomeEmail] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);
  const navigate = useNavigate();

  const isAdmin = auth.currentUser?.email === 'mkarthikeya24@gmail.com' || auth.currentUser?.email === 'Kbsn1170@gmail.com';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      if (!isPasscodeVerified) return;
      try {
        const [usersSnap, paymentsSnap, jobsSnap, announcementSnap, reviewsSnap, statsRes] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'payments')),
          getDocs(collection(db, 'jobs')),
          getDocs(collection(db, 'system_announcements')),
          getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))),
          fetch(`/api/admin/stats?adminId=${auth.currentUser?.uid}`)
        ]);

        const usersList = usersSnap.docs.map(d => d.data() as UserData);
        const paymentsList = paymentsSnap.docs.map(d => d.data() as PaymentData);
        const jobsList = jobsSnap.docs.map(d => d.data() as JobData);
        const reviewsList = reviewsSnap.docs.map(d => d.data() as ReviewData);
        
        if (!announcementSnap.empty) {
          setAnnouncement(announcementSnap.docs[0].data().text || '');
        }

        if (statsRes.ok) {
          const stats = await statsRes.json();
          setAdminStats(stats);
        }

        setUsers(usersList);
        setPayments(paymentsList);
        setJobs(jobsList);
        setReviews(reviewsList);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Failed to load admin data. Check permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, navigate, isPasscodeVerified]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '240305') {
      setIsPasscodeVerified(true);
      toast.success("Identity verified. Welcome, Admin.");
    } else {
      toast.error("Invalid passcode");
      setPasscode('');
    }
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isBanned: !currentStatus
      });
      
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, isBanned: !currentStatus } : u));
      toast.success(currentStatus ? "User unbanned successfully" : "User banned successfully");
    } catch (error) {
      console.error("Error toggling ban:", error);
      toast.error("Failed to update user status.");
    }
  };

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    try {
      const announcementRef = doc(db, 'system_announcements', 'global');
      await updateDoc(announcementRef, {
        text: announcement,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email
      }).catch(async (err) => {
        // If doc doesn't exist, create it
        if (err.code === 'not-found') {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(announcementRef, {
            text: announcement,
            updatedAt: new Date().toISOString(),
            updatedBy: auth.currentUser?.email
          });
        } else {
          throw err;
        }
      });
      toast.success("Announcement updated successfully");
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("Failed to save announcement.");
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleUpdateWallet = async () => {
    if (!selectedUser || !walletAdjustment) return;
    setIsAdjustingWallet(true);
    try {
      const res = await fetch('/api/admin/update-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: auth.currentUser?.uid,
          userId: selectedUser.uid,
          amount: walletAdjustment,
          reason: adjustmentReason
        })
      });

      if (res.ok) {
        toast.success("Wallet adjusted successfully");
        setWalletAdjustment(0);
        setAdjustmentReason('');
        // Refresh balance and stats
        fetchUserHistory(selectedUser.uid);
        const statsRes = await fetch(`/api/admin/stats?adminId=${auth.currentUser?.uid}`);
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setAdminStats(stats);
        }
      } else {
        toast.error("Failed to adjust wallet");
      }
    } catch (error) {
      toast.error("Error adjusting wallet");
    } finally {
      setIsAdjustingWallet(false);
    }
  };

  const handleSendWelcomeEmail = async (user: UserData) => {
    setIsSendingWelcomeEmail(true);
    try {
      const res = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName
        })
      });

      if (res.ok) {
        toast.success(`Welcome email sent to ${user.email}`);
      } else {
        toast.error("Failed to send welcome email");
      }
    } catch (error) {
      toast.error("Error sending welcome email");
    } finally {
      setIsSendingWelcomeEmail(false);
    }
  };

  const fetchUserHistory = async (userId: string) => {
    setIsLoadingHistory(true);
    try {
      const [historyRes, balanceRes] = await Promise.all([
        fetch(`/api/admin/user-history?adminId=${auth.currentUser?.uid}&userId=${userId}`),
        fetch(`/api/wallet-balance?userId=${userId}`)
      ]);

      if (historyRes.ok) {
        const history = await historyRes.json();
        setUserHistory(history);
      }

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setSelectedUserBalance(balanceData.balance);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchUserHistory(selectedUser.uid);
    } else {
      setUserHistory([]);
    }
  }, [selectedUser]);

  const totalRevenue = adminStats?.totalRevenue || payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && isPasscodeVerified) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!isPasscodeVerified) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-bg-card border border-border-subtle p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-brand-accent/20 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-brand-accent" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase mb-2">Restricted Access</h2>
            <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.3em]">Enter administrative passcode</p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-6">
            <input 
              type="password" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••"
              className="w-full bg-bg-deep border border-border-subtle rounded-2xl py-5 px-6 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-brand-accent/50 transition-all font-black"
              autoFocus
            />
            <button 
              type="submit"
              className="w-full bg-brand-accent text-bg-deep py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:opacity-90 transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)]"
            >
              Verify Identity
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-10 bg-bg-deep/30 custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <Link to="/dashboard" className="flex items-center gap-2 text-brand-muted hover:text-brand-primary transition-colors mb-4 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase">
              Command <span className="text-brand-accent">Center</span>
            </h1>
            <p className="text-brand-muted mt-2 text-xs sm:text-sm font-medium">System overview and user management.</p>
          </div>

          <div className="flex items-center gap-4 bg-bg-card/30 border border-border-subtle p-4 rounded-2xl backdrop-blur-xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-brand-accent" />
            </div>
            <div className="min-w-0">
              <div className="text-[8px] sm:text-[10px] font-black text-brand-muted uppercase tracking-widest">Admin Access</div>
              <div className="text-xs sm:text-sm font-black truncate">{auth.currentUser?.email}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-bg-card/20 p-1.5 rounded-2xl border border-border-subtle w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'reviews', label: 'Reviews', icon: MessageCircle },
            { id: 'announcements', label: 'Announcements', icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-brand-accent text-bg-deep shadow-lg' 
                  : 'text-brand-muted hover:text-brand-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: 'Total Users', value: adminStats?.totalUsers || users.length, icon: Users, color: 'text-blue-400' },
                { label: 'Total Revenue', value: `₹${totalRevenue}`, icon: DollarSign, color: 'text-emerald-400' },
                { label: 'Resumes Generated', value: adminStats?.totalResumes || jobs.length, icon: FileText, color: 'text-purple-400' },
                { label: 'Active Payments', value: adminStats?.recentPayments?.length || payments.length, icon: CreditCard, color: 'text-cyan-400' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-bg-card/20 border border-border-subtle p-6 rounded-3xl backdrop-blur-sm group hover:border-brand-accent/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-bg-deep border border-border-subtle ${stat.color}`}>
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight mb-1">{stat.value}</div>
                  <div className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Payments */}
              <div className="bg-bg-card/20 border border-border-subtle p-8 rounded-[2.5rem] backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Recent Payments
                  </h2>
                  <Link to="/admin" className="text-[10px] font-black text-brand-accent uppercase tracking-widest hover:opacity-70 transition-opacity">View All</Link>
                </div>
                <div className="space-y-4">
                  {adminStats?.recentPayments?.map((payment: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-bg-deep/30 border border-border-subtle group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-brand-primary">₹{payment.amount} {payment.type}</div>
                          <div className="text-[9px] text-brand-muted font-bold uppercase tracking-widest mt-0.5">
                            {new Date(payment.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-[9px] font-black text-brand-muted uppercase tracking-widest bg-bg-card px-3 py-1 rounded-lg border border-border-subtle">
                        {payment.userId.slice(0, 8)}...
                      </div>
                    </div>
                  ))}
                  {(!adminStats?.recentPayments || adminStats.recentPayments.length === 0) && (
                    <div className="text-center py-12 text-brand-muted uppercase text-[10px] font-black tracking-widest opacity-30">
                      No recent payments
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Resumes */}
              <div className="bg-bg-card/20 border border-border-subtle p-8 rounded-[2.5rem] backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Recent Resumes
                  </h2>
                  <Link to="/admin" className="text-[10px] font-black text-brand-accent uppercase tracking-widest hover:opacity-70 transition-opacity">View All</Link>
                </div>
                <div className="space-y-4">
                  {adminStats?.recentResumes?.map((resume: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-bg-deep/30 border border-border-subtle group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Target className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-brand-primary">{resume.company}</div>
                          <div className="text-[9px] text-brand-muted font-bold uppercase tracking-widest mt-0.5">
                            {resume.role} • {new Date(resume.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-brand-accent">{resume.atsScore || 0}%</div>
                    </div>
                  ))}
                  {(!adminStats?.recentResumes || adminStats.recentResumes.length === 0) && (
                    <div className="text-center py-12 text-brand-muted uppercase text-[10px] font-black tracking-widest opacity-30">
                      No recent resumes
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-bg-card/20 border border-border-subtle p-8 rounded-[2.5rem] backdrop-blur-xl">
              <h2 className="text-xl font-black tracking-tight uppercase mb-8 flex items-center gap-3">
                <Activity className="w-5 h-5 text-cyan-400" />
                System Health
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Gemini AI Engine', status: 'Operational', color: 'bg-emerald-500' },
                  { label: 'Firestore Database', status: 'Operational', color: 'bg-emerald-500' },
                  { label: 'Razorpay Gateway', status: 'Operational', color: 'bg-emerald-500' },
                  { label: 'Auth Service', status: 'Operational', color: 'bg-emerald-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-bg-deep/30 border border-border-subtle">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{item.label}</span>
                      <span className="text-xs font-black mt-1">{item.status}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_10px_rgba(16,185,129,0.5)]`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-8">
            {/* System Announcement */}
            <div className="bg-bg-card/20 border border-brand-accent/30 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-24 h-24 text-brand-accent" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                    <Zap className="w-5 h-5 text-brand-accent" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight uppercase">Global Announcement</h2>
                </div>
                <p className="text-xs text-brand-muted font-medium mb-6">This message will be displayed to all users at the top of their dashboard.</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    placeholder="Enter a message for all users (e.g., Scheduled maintenance at 10 PM)..."
                    className="flex-1 bg-bg-deep/50 border border-border-subtle rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-brand-accent/50 transition-all font-medium"
                  />
                  <button
                    onClick={handleSaveAnnouncement}
                    disabled={isSavingAnnouncement}
                    className="bg-brand-accent text-bg-deep px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Update Broadcast
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">User Reviews</h2>
                <p className="text-xs text-brand-muted font-medium mt-1">Direct feedback from your community.</p>
              </div>
              <div className="bg-bg-card/30 border border-border-subtle px-6 py-3 rounded-2xl backdrop-blur-xl flex items-center gap-3">
                <Star className="w-4 h-4 text-brand-accent fill-brand-accent" />
                <span className="text-sm font-black text-brand-primary">
                  {reviews.length > 0 
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                    : '0.0'}
                </span>
                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Avg Rating</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-bg-card/20 border border-border-subtle p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col group hover:border-brand-accent/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-bg-deep border border-border-subtle overflow-hidden flex items-center justify-center">
                        {review.userPhoto ? (
                          <img src={review.userPhoto} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Users className="w-5 h-5 text-brand-muted" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-brand-primary">{review.userName}</div>
                        <div className="text-[9px] text-brand-muted font-bold uppercase tracking-widest">{review.userEmail}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < review.rating ? 'text-brand-accent fill-brand-accent' : 'text-brand-muted/20'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="relative">
                      <MessageCircle className="absolute -top-2 -left-2 w-8 h-8 text-brand-accent/5 -z-10" />
                      <p className="text-sm text-brand-muted leading-relaxed font-medium italic">
                        "{review.message}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border-subtle/30 flex items-center justify-between">
                    <div className="text-[9px] font-black text-brand-muted uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                    <button 
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this review?")) {
                          try {
                            const { deleteDoc, doc } = await import('firebase/firestore');
                            await deleteDoc(doc(db, 'reviews', review.id));
                            setReviews(prev => prev.filter(r => r.id !== review.id));
                            toast.success("Review deleted");
                          } catch (err) {
                            toast.error("Failed to delete review");
                          }
                        }
                      }}
                      className="p-2 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
              {reviews.length === 0 && (
                <div className="col-span-full py-24 text-center">
                  <MessageCircle className="w-16 h-16 text-brand-muted mx-auto mb-6 opacity-10" />
                  <div className="text-sm font-black text-brand-muted uppercase tracking-widest">No reviews yet</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-bg-card/20 border border-border-subtle rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
            <div className="p-8 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">User Registry</h2>
                <p className="text-xs text-brand-muted font-medium mt-1">Manage accounts and monitor activity.</p>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-accent transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-bg-deep/50 border border-border-subtle rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-accent/50 w-full md:w-80 transition-all font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-deep/30">
                    <th className="px-8 py-5 text-[10px] font-black text-brand-muted uppercase tracking-widest">User</th>
                    <th className="px-8 py-5 text-[10px] font-black text-brand-muted uppercase tracking-widest">Joined</th>
                    <th className="px-8 py-5 text-[10px] font-black text-brand-muted uppercase tracking-widest">Activity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-brand-muted uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-brand-muted uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30">
                  {filteredUsers.map((user) => {
                    const userPayments = payments.filter(p => p.userId === user.uid);
                    const userResumes = jobs.filter(j => j.userId === user.uid);
                    const totalSpent = userPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

                    return (
                      <tr key={user.uid} className="hover:bg-brand-primary/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-bg-deep border border-border-subtle overflow-hidden flex items-center justify-center">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Users className="w-5 h-5 text-brand-muted" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-black">{user.displayName || 'Anonymous'}</div>
                              <div className="text-[10px] text-brand-muted font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-xs font-medium text-brand-muted flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-black text-brand-primary flex items-center gap-1.5">
                              <FileText className="w-3 h-3" />
                              {userResumes.length} Resumes
                            </div>
                            <div className="text-[10px] font-black text-emerald-400 flex items-center gap-1.5">
                              <DollarSign className="w-3 h-3" />
                              ₹{adminStats?.revenuePerUser?.[user.uid] || totalSpent} Revenue
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {user.isBanned ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-400 uppercase tracking-widest">
                              <Ban className="w-3 h-3" />
                              Terminated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-2.5 rounded-xl border border-border-subtle bg-bg-deep/50 text-brand-muted hover:text-brand-primary hover:border-brand-accent/30 transition-all"
                              title="View User Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleBan(user.uid, !!user.isBanned)}
                              className={`p-2.5 rounded-xl border transition-all ${
                                user.isBanned 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-bg-deep' 
                                  : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-bg-deep'
                              }`}
                              title={user.isBanned ? "Restore Account (Revoke Ban)" : "Terminate Account (Ban)"}
                            >
                              {user.isBanned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="p-20 text-center">
                  <Users className="w-12 h-12 text-brand-muted mx-auto mb-4 opacity-20" />
                  <div className="text-sm font-black text-brand-muted uppercase tracking-widest">No users found</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-bg-deep/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-bg-card border border-border-subtle rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-bg-deep/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-bg-card border border-border-subtle overflow-hidden flex items-center justify-center">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Users className="w-6 h-6 text-brand-muted" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight uppercase">{selectedUser.displayName || 'Anonymous'}</h3>
                    <p className="text-xs text-brand-muted font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-3 rounded-xl bg-bg-card/50 text-brand-muted hover:text-brand-primary border border-border-subtle transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="p-6 rounded-3xl bg-bg-deep/30 border border-border-subtle">
                    <div className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2">Current Balance</div>
                    <div className="text-xl font-black text-brand-accent">₹{selectedUserBalance !== null ? selectedUserBalance : '...'}</div>
                  </div>
                  <div className="p-6 rounded-3xl bg-bg-deep/30 border border-border-subtle">
                    <div className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2">Total Syntheses</div>
                    <div className="text-xl font-black text-brand-primary">{userHistory.length}</div>
                  </div>
                  <div className="p-6 rounded-3xl bg-bg-deep/30 border border-border-subtle">
                    <div className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2">Total Investment</div>
                    <div className="text-xl font-black text-emerald-400">₹{adminStats?.revenuePerUser?.[selectedUser.uid] || 0}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  {/* Wallet Adjustment */}
                  <div className="p-8 rounded-[2.5rem] bg-bg-deep/30 border border-border-subtle">
                    <h4 className="text-sm font-black uppercase tracking-widest text-brand-muted mb-6 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Wallet Adjustment
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setWalletAdjustment(prev => prev - 10)}
                          className="p-3 rounded-xl bg-bg-card border border-border-subtle text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input 
                          type="number" 
                          value={walletAdjustment}
                          onChange={(e) => setWalletAdjustment(Number(e.target.value))}
                          className="flex-1 bg-bg-deep border border-border-subtle rounded-xl py-3 px-4 text-center font-black text-lg focus:outline-none focus:border-brand-accent/50"
                        />
                        <button 
                          onClick={() => setWalletAdjustment(prev => prev + 10)}
                          className="p-3 rounded-xl bg-bg-card border border-border-subtle text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Reason for adjustment..."
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        className="w-full bg-bg-deep border border-border-subtle rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-brand-accent/50"
                      />
                      <button
                        onClick={handleUpdateWallet}
                        disabled={isAdjustingWallet || !walletAdjustment}
                        className="w-full bg-brand-accent text-bg-deep py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isAdjustingWallet ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Apply Adjustment
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-8 rounded-[2.5rem] bg-bg-deep/30 border border-border-subtle">
                    <h4 className="text-sm font-black uppercase tracking-widest text-brand-muted mb-6 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-brand-accent" />
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleToggleBan(selectedUser.uid, !!selectedUser.isBanned)}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                          selectedUser.isBanned 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-bg-deep' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-bg-deep'
                        }`}
                      >
                        {selectedUser.isBanned ? <UserCheck className="w-6 h-6" /> : <UserX className="w-6 h-6" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">{selectedUser.isBanned ? 'Restore' : 'Terminate'}</span>
                      </button>
                      <button
                        onClick={() => handleSendWelcomeEmail(selectedUser)}
                        disabled={isSendingWelcomeEmail}
                        className="p-4 rounded-2xl bg-bg-card border border-border-subtle text-brand-accent hover:bg-brand-accent hover:text-bg-deep hover:border-brand-accent transition-all flex flex-col items-center gap-3 disabled:opacity-50"
                      >
                        {isSendingWelcomeEmail ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mail className="w-6 h-6" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">Welcome Mail</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-brand-muted mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Resume Generation History
                      </div>
                      {isLoadingHistory && <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />}
                    </h4>
                    <div className="space-y-4">
                      {userHistory.length > 0 ? (
                        userHistory.map((history, i) => (
                          <div key={history.id || i} className="p-6 rounded-3xl bg-bg-deep/30 border border-border-subtle hover:border-brand-accent/30 transition-all group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-brand-muted" />
                                </div>
                                <div>
                                  <div className="text-sm font-black text-brand-primary">{history.company}</div>
                                  <div className="text-xs text-brand-muted font-medium flex items-center gap-2">
                                    <Briefcase className="w-3 h-3" />
                                    {history.role}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <div className="text-[10px] font-black text-brand-accent uppercase tracking-widest flex items-center gap-1.5 justify-end">
                                    <Target className="w-3 h-3" />
                                    {history.atsScore || 0}% Score
                                  </div>
                                  <div className="text-[9px] text-brand-muted font-bold uppercase tracking-widest mt-1">
                                    {new Date(history.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center bg-bg-deep/20 rounded-3xl border border-dashed border-border-subtle">
                          <FileText className="w-8 h-8 text-brand-muted mx-auto mb-3 opacity-20" />
                          <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">No synthesis records found</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-brand-muted mb-6 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment Transactions
                    </h4>
                    <div className="space-y-3">
                      {payments.filter(p => p.userId === selectedUser.uid).length > 0 ? (
                        payments.filter(p => p.userId === selectedUser.uid).map((payment, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-bg-deep/30 border border-border-subtle">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <div className="text-xs font-black text-brand-primary">{payment.type || 'Subscription'}</div>
                                <div className="text-[9px] text-brand-muted font-bold uppercase tracking-widest">{new Date(payment.createdAt).toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="text-sm font-black text-emerald-400">₹{payment.amount}</div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center bg-bg-deep/20 rounded-3xl border border-dashed border-border-subtle">
                          <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">No payment history</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-border-subtle bg-bg-deep/30 flex justify-end gap-4">
                <button
                  onClick={() => handleToggleBan(selectedUser.uid, !!selectedUser.isBanned)}
                  className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                    selectedUser.isBanned 
                      ? 'bg-emerald-500 text-bg-deep hover:opacity-90' 
                      : 'bg-red-500 text-bg-deep hover:opacity-90'
                  }`}
                >
                  {selectedUser.isBanned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  {selectedUser.isBanned ? "Revoke Ban" : "Terminate User"}
                </button>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="px-8 py-4 rounded-2xl bg-bg-card/50 text-brand-muted font-black text-[10px] uppercase tracking-widest border border-border-subtle hover:text-brand-primary transition-all"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
