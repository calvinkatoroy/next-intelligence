import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingView } from './components/LandingView';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { DashboardView } from './components/DashboardView';
import { SearchView } from './components/SearchView';
import { AlertsView } from './components/AlertsView';
import { Toaster } from 'sonner';

function AppContent() {
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'search' | 'assets' | 'alerts' | 'settings'>('landing');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && view === 'landing') {
        setView('dashboard');
      } else if (!user && view !== 'landing' && view !== 'login' && view !== 'register') {
        setView('landing');
      }
    }
  }, [user, loading, view]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {view === 'landing' && <LandingView setView={setView} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
      {view === 'login' && <LoginView setView={setView} />}
      {view === 'register' && <RegisterView setView={setView} />}
      {view === 'dashboard' && <DashboardView setView={setView} searchQuery={searchQuery} />}
      {view === 'search' && <SearchView setView={setView} />}
      {view === 'alerts' && <AlertsView setView={setView} />}
      <Toaster position="top-right" theme="dark" />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
