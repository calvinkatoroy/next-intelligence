import { useState, useEffect, useRef } from 'react';
import { Menu, User, Activity, Search, Database as DatabaseIcon, Bell, Settings, LogOut, Globe, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';
import anime from 'animejs';
import { ArtisticBackground } from './ArtisticBackground';
import { GlassCard } from './GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

interface AlertsViewProps {
  setView: (view: string) => void;
}

type Alert = Database['public']['Tables']['alerts']['Row'];

export function AlertsView({ setView }: AlertsViewProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, read: true } : a));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'medium':
        return <Info className="w-5 h-5 text-[#00F2FF]" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-[#00FF41]" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'border-red-400/30 bg-red-400/10';
      case 'medium':
        return 'border-[#00F2FF]/30 bg-[#00F2FF]/10';
      case 'low':
        return 'border-[#00FF41]/30 bg-[#00FF41]/10';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  const menuItems = [
    { icon: Activity, label: 'Monitor', view: 'dashboard' },
    { icon: Search, label: 'Search', view: 'search' },
    { icon: DatabaseIcon, label: 'Assets', view: 'assets' },
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

  const unreadCount = alerts.filter(a => !a.read).length;

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
                item.view === 'alerts' ? 'text-[#00FF41]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.view === 'alerts' && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#00F2FF]/10 to-[#00FF41]/10 rounded-lg" />
              )}
              <item.icon className="w-5 h-5 flex-shrink-0 relative z-10" />
              <span className="xl:block lg:hidden text-sm font-bold relative z-10">{item.label}</span>
              {item.view === 'alerts' && unreadCount > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold xl:block lg:hidden">
                  {unreadCount}
                </span>
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
                <h1 className="text-xl font-bold">Alerts</h1>
                <p className="text-sm text-slate-500 font-mono">
                  {unreadCount} unread • {alerts.length} total
                </p>
              </div>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <User className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-slate-500">Loading alerts...</div>
            </div>
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <GlassCard
                key={alert.id}
                className={`p-4 ${getSeverityColor(alert.severity)} ${!alert.read ? 'border-l-4' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm">{alert.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!alert.read && (
                          <button
                            onClick={() => markAsRead(alert.id)}
                            className="text-xs text-[#00FF41] hover:text-[#00cc33] transition-colors"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="capitalize">{alert.severity}</span>
                      <span>•</span>
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))
          ) : (
            <GlassCard className="p-12 text-center">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Alerts</h3>
              <p className="text-slate-500">You're all caught up! No alerts at this time.</p>
            </GlassCard>
          )}
        </div>
      </main>
    </div>
  );
}
