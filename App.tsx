
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Sorties } from './pages/Sorties';
import { Actualite } from './pages/Actualite';
import { Artists } from './pages/Artists';
import { ArtistDetail } from './pages/ArtistDetail';
import { Tasks } from './pages/Tasks';
import { Calendar } from './pages/Calendar';
import { Team } from './pages/Team';
import { Meetings } from './pages/Meetings';
import Management from './pages/Management';
import { Resources } from './pages/Resources';
import { Login } from './pages/Login';
import { useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col min-h-full"
    >
      {children}
    </motion.div>
  );
};

// Routeur protégé pour rediriger vers login si non-authentifié
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-nexus-dark flex items-center justify-center">
        <Loader2 className="text-nexus-purple animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <ToastProvider>
      <Router>
        <div className="flex min-h-screen bg-nexus-dark text-white font-sans selection:bg-nexus-purple selection:text-white">
        {user && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
        
        <main className={`flex-1 ${user ? 'lg:ml-64' : ''} min-h-screen flex flex-col relative overflow-hidden`}>
          {user && (
            <>
              <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-nexus-purple/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none z-0" />
              <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-nexus-cyan/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none z-0" />
              <Header onMenuClick={() => setIsSidebarOpen(true)} />
            </>
          )}
          
          <div className="relative z-10 flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
                
                <Route path="/" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
                <Route path="/actualite" element={<ProtectedRoute><PageWrapper><Actualite /></PageWrapper></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><PageWrapper><Projects /></PageWrapper></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><PageWrapper><ProjectDetail /></PageWrapper></ProtectedRoute>} />
                <Route path="/sorties" element={<ProtectedRoute><PageWrapper><Sorties /></PageWrapper></ProtectedRoute>} />
                <Route path="/artists" element={<ProtectedRoute><PageWrapper><Artists /></PageWrapper></ProtectedRoute>} />
                <Route path="/artists/:id" element={<ProtectedRoute><PageWrapper><ArtistDetail /></PageWrapper></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><PageWrapper><Tasks /></PageWrapper></ProtectedRoute>} />
                <Route path="/meetings" element={<ProtectedRoute><PageWrapper><Meetings /></PageWrapper></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><PageWrapper><Calendar /></PageWrapper></ProtectedRoute>} />
                <Route path="/resources" element={<ProtectedRoute><PageWrapper><Resources /></PageWrapper></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><PageWrapper><Team /></PageWrapper></ProtectedRoute>} />
                <Route path="/management" element={<ProtectedRoute><PageWrapper><Management /></PageWrapper></ProtectedRoute>} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
