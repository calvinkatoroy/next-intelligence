import { useState, useEffect, useRef } from 'react';
import { Menu, User, Activity, Search as SearchIcon, Database as DatabaseIcon, Bell, Settings, LogOut, Globe, Loader, Filter, FileText, ChevronRight } from 'lucide-react';
import anime from 'animejs';
import { ArtisticBackground } from './ArtisticBackground';
import { GlassCard } from './GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

interface SearchViewProps {
  setView: (view: string) => void;
}

type ScanResult = Database['public']['Tables']['scan_results']['Row'];

export function SearchView({ setView }: SearchViewProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const { user, signOut } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', user.id)
        .or(`url.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,content_preview.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filterSeverity !== 'all') {
        if (filterSeverity === 'high') {
          query = query.gte('relevance_score', 0.7);
        } else if (filterSeverity === 'medium') {
          query = query.gte('relevance_score', 0.4).lt('relevance_score', 0.7);
        } else {
          query = query.lt('relevance_score', 0.4);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { icon: Activity, label: 'Monitor', view: 'dashboard' },
    { icon: SearchIcon, label: 'Search', view: 'search' },
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
                item.view === 'search' ? 'text-[#00FF41]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.view === 'search' && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#00F2FF]/10 to-[#00FF41]/10 rounded-lg" />
              )}
              <item.icon className="w-5 h-5 flex-shrink-0 relative z-10" />
              <span className="xl:block lg:hidden text-sm font-bold relative z-10">{item.label}</span>
              {item.view === 'search' && (
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
                <h1 className="text-xl font-bold">Search Intelligence</h1>
                <p className="text-sm text-slate-500 font-mono">Deep search across all results</p>
              </div>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <User className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Search Bar */}
          <GlassCard className="p-4" gradient>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                  <SearchIcon className="w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search URLs, titles, content..."
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00FF41]/50 transition-colors"
                >
                  <option value="all">All Severity</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="px-6 py-3 bg-gradient-to-br from-[#00F2FF] to-[#00FF41] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Results */}
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <GlassCard key={result.id} className="p-4 space-y-3" hover gradient>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FileText className="w-3 h-3" />
                      {result.source}
                    </div>
                    <div className={`px-2 py-0.5 rounded border text-xs font-mono ${
                      result.relevance_score >= 0.7
                        ? 'bg-[#FF2A4D]/10 text-[#FF2A4D] border-[#FF2A4D]/20'
                        : result.relevance_score >= 0.4
                        ? 'bg-[#00F2FF]/10 text-[#00F2FF] border-[#00F2FF]/20'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>
                      {result.relevance_score.toFixed(2)}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1">{result.title}</h3>
                  <div className="bg-black/20 backdrop-blur-sm rounded p-2 text-xs text-slate-500 font-mono h-16 overflow-hidden relative">
                    {result.content_preview || 'No preview available'}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0f0f]" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{new Date(result.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 hover:text-[#00FF41] transition-colors cursor-pointer">
                      View <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : searchQuery && !loading ? (
            <GlassCard className="p-12 text-center">
              <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Results Found</h3>
              <p className="text-slate-500">Try adjusting your search query or filters</p>
            </GlassCard>
          ) : !searchQuery ? (
            <GlassCard className="p-12 text-center">
              <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Start Searching</h3>
              <p className="text-slate-500">Enter a query to search across all scan results</p>
            </GlassCard>
          ) : null}
        </div>
      </main>
    </div>
  );
}
