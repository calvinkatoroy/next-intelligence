import { useState, useEffect, useRef } from 'react';
import { Menu, User, Activity, Search, Database, Bell, Settings, LogOut, Globe, FileText, ChevronRight, Loader } from 'lucide-react';
import anime from 'animejs';
import { ArtisticBackground } from './ArtisticBackground';
import { GlassCard } from './GlassCard';
import { ScanForm } from './ScanForm';
import { ResultsList } from './ResultsList';
import { useScan } from '../hooks/useScan';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { ScanStatus } from '../types';

interface DashboardViewProps {
  setView: (view: string) => void;
  searchQuery: string;
}

export function DashboardView({ setView, searchQuery }: DashboardViewProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [allScans, setAllScans] = useState<ScanStatus[]>([]);
  const { currentScan, results, isLoading } = useScan(activeScanId || undefined);
  const { user, signOut } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadScans();
  }, []);

  useEffect(() => {
    if (sidebarRef.current && isMobileMenuOpen) {
      anime({
        targets: sidebarRef.current,
        translateX: ['-100%', '0%'],
        duration: 300,
        easing: 'easeOutCubic'
      });
    }
  }, [isMobileMenuOpen]);

  const loadScans = async () => {
    try {
      const scans = await apiClient.listScans();
      setAllScans(scans);
    } catch (error) {
      console.error('Failed to load scans:', error);
    }
  };

  const handleScanStarted = (scanId: string) => {
    setActiveScanId(scanId);
    loadScans();
  };

  const menuItems = [
    { icon: Activity, label: 'Monitor', view: 'dashboard' },
    { icon: Search, label: 'Search', view: 'search' },
    { icon: Database, label: 'Assets', view: 'assets' },
    { icon: Bell, label: 'Alerts', view: 'alerts' },
  ];

  const handleMenuClick = (view: string) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setView('landing');
  };

  const runningScans = allScans.filter(s => s.status === 'running' || s.status === 'queued');
  const completedScans = allScans.filter(s => s.status === 'completed');
  const totalResults = completedScans.reduce((sum, scan) => sum + scan.total_results, 0);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex relative overflow-hidden">
      <ArtisticBackground />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00F2FF]/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-[#00FF41]/10 to-transparent rounded-full blur-3xl" />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 lg:w-20 xl:w-64 backdrop-blur-xl bg-[#0f0f0f]/80 border-r border-white/10 flex flex-col transform transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00F2FF] to-[#00FF41] blur-lg opacity-20" />
              <Globe className="w-5 h-5 text-[#00FF41] relative z-10" />
            </div>
            <span className="xl:block lg:hidden font-bold tracking-tight bg-gradient-to-br from-[#00F2FF] to-[#00FF41] bg-clip-text text-transparent">
              NEXT
            </span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleMenuClick(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden group ${
                item.view === 'dashboard' ? 'text-[#00FF41]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.view === 'dashboard' && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#00F2FF]/10 to-[#00FF41]/10 rounded-lg" />
              )}
              <item.icon className="w-5 h-5 flex-shrink-0 relative z-10" />
              <span className="xl:block lg:hidden text-sm font-bold relative z-10">{item.label}</span>
              {item.view === 'dashboard' && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#00F2FF] to-[#00FF41] xl:block lg:hidden" />
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10 space-y-1">
          <button
            onClick={() => handleMenuClick('settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="xl:block lg:hidden text-sm font-bold">Settings</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="xl:block lg:hidden text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#0f0f0f]/60 border-b border-white/10 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Threat Monitor</h1>
                <p className="text-sm text-slate-500 font-mono">
                  Real-time detection • {searchQuery || 'Global'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GlassCard className="px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00FF41] rounded-full animate-pulse" />
                <span className="text-sm text-slate-400 hidden sm:block">Live</span>
              </GlassCard>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <User className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active', value: runningScans.length.toString(), color: 'from-[#00F2FF] to-[#00F2FF]/50' },
              { label: 'Total Scans', value: allScans.length.toString(), color: 'from-slate-400 to-slate-400/50' },
              { label: 'Completed', value: completedScans.length.toString(), color: 'from-[#00FF41] to-[#00FF41]/50' },
              { label: 'Results', value: totalResults.toString(), color: 'from-[#00FF41] to-[#00FF41]/50' }
            ].map((stat, i) => (
              <GlassCard key={i} className="p-4" gradient>
                <div className="text-sm text-slate-500 mb-1">{stat.label}</div>
                <div className={`text-2xl font-bold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Current Scan Status */}
          {currentScan && (
            <GlassCard className="p-6" glow gradient>
              <h2 className="text-xl font-bold mb-4">Current Scan Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-mono">Scan ID:</span>
                  <span className="text-sm text-neon-cyan font-mono">{currentScan.scan_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Status:</span>
                  <span className={`text-sm font-bold ${
                    currentScan.status === 'completed' ? 'text-[#00FF41]' :
                    currentScan.status === 'failed' ? 'text-red-400' :
                    'text-[#00F2FF]'
                  }`}>
                    {currentScan.status.toUpperCase()}
                  </span>
                </div>
                {currentScan.status === 'running' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Progress:</span>
                      <span className="text-sm text-neon-cyan font-mono">
                        {Math.round(currentScan.progress * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-neon-cyan to-neon-green h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentScan.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Results Found:</span>
                  <span className="text-sm text-neon-green font-mono">{currentScan.total_results}</span>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Scan Form & Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ScanForm onScanStarted={handleScanStarted} />
            </div>
            <div className="lg:col-span-2">
              <ResultsList results={results?.results || []} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
