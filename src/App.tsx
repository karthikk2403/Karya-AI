import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import JobTracker from './pages/JobTracker';
import InterviewPrep from './pages/InterviewPrep';
import Features from './pages/Features';
import Wallet from './pages/Wallet';
import Marketing from './pages/Marketing';
import Enterprise from './pages/Enterprise';
import About from './pages/About';
import Settings from './pages/Settings';
import CareerPredictor from './pages/CareerPredictor';
import ResumeBuilder from './pages/ResumeBuilder';
import Resumes from './pages/Resumes';
import HowToUse from './pages/HowToUse';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import Banned from './pages/Banned';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Security from './pages/Security';
import { Toaster } from 'sonner';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { ThemeProvider } from './lib/ThemeContext';
import { handleFirestoreError, OperationType } from './lib/firestore-utils';

// Protected Route wrapper
const ProtectedRoute = ({ children, user, loading, isBanned }: { children: React.ReactNode, user: any, loading: boolean, isBanned: boolean }) => {
  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-black uppercase tracking-widest">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <span className="text-xs">Authenticating...</span>
      </div>
    </div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (isBanned) {
    return <Navigate to="/banned" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    // Test Firestore connection on boot
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'system_announcements', 'connection_test'));
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          console.error("Firestore is offline. Please check your configuration.");
        }
        // We don't throw here to avoid crashing the whole app on a simple connection test
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().isBanned) {
            setIsBanned(true);
          } else {
            setIsBanned(false);
          }
        } catch (error) {
          console.error("Error checking ban status:", error);
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setIsBanned(false);
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <Toaster theme="dark" position="bottom-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
          <Route path="/guide" element={<HowToUse />} />
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/wallet" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <Wallet />
            </ProtectedRoute>
          } />
          <Route path="/about-wallet" element={<Marketing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/banned" element={<Banned />} />
          
          <Route path="/admin" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/onboarding" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <Onboarding />
            </ProtectedRoute>
          } />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tracker" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <Layout>
                <JobTracker />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/interview" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <Layout>
                <InterviewPrep />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/career-predictor" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <Layout>
                <CareerPredictor />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/resume-builder" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <ResumeBuilder />
            </ProtectedRoute>
          } />
          <Route path="/resumes" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <Layout>
                <Resumes />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute user={user} loading={loading} isBanned={isBanned}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
