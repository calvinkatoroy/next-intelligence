import { useEffect, useRef } from 'react';
import { Globe, Terminal, ChevronDown, User, Database, Bell, ArrowRight } from 'lucide-react';
import anime from 'animejs';
import { ArtisticBackground } from './ArtisticBackground';
import { GlassCard } from './GlassCard';

interface LandingViewProps {
  setView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function LandingView({ setView, searchQuery, setSearchQuery }: LandingViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const tutorialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      anime({
        targets: contentRef.current.querySelectorAll('.fade-in'),
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(80, { start: 100 }),
        duration: 600,
        easing: 'easeOutCubic'
      });
    }
  }, []);

  const scrollToTutorial = () => {
    tutorialRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white relative overflow-hidden">
      <ArtisticBackground />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-[#00F2FF]/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#00FF41]/20 to-transparent rounded-full blur-3xl" />
      
      <nav className="relative z-10 p-6">
        <GlassCard className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00F2FF] to-[#00FF41] blur-lg opacity-30" />
              <Globe className="w-5 h-5 text-[#00FF41] relative z-10" />
            </div>
            <span className="font-bold tracking-tight bg-gradient-to-br from-[#00F2FF] to-[#00FF41] bg-clip-text text-transparent">
              NEXT Intelligence
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('login')}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => setView('register')}
              className="px-4 py-2 bg-gradient-to-br from-[#00F2FF] to-[#00FF41] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        </GlassCard>
      </nav>

      <section
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-center px-4 py-20 min-h-[80vh]"
      >
        <div className="fade-in max-w-3xl text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            Unmask the{' '}
            <span className="bg-gradient-to-br from-[#00F2FF] to-[#00FF41] bg-clip-text text-transparent">
              Dark Web
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            AI-driven OSINT platform. Monitor paste sites, credentials, and dark web chatter in real-time.
          </p>
          <div className="fade-in max-w-xl mx-auto mt-8">
            <GlassCard className="p-2" gradient>
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-slate-500 ml-2" />
                <input
                  type="text"
                  placeholder="Enter target domain or paste URL"
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-slate-600 px-2 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  onClick={() => setView('dashboard')}
                  className="px-4 py-2 bg-gradient-to-br from-[#00F2FF] to-[#00FF41] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Scan
                </button>
              </div>
            </GlassCard>
          </div>
          <div className="fade-in flex items-center justify-center gap-8 mt-12 text-sm flex-wrap">
            {[
              { label: '2.4M', desc: 'Records Scanned' },
              { label: '24/7', desc: 'Monitoring' },
              { label: '89', desc: 'Active Threats' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-br from-[#00F2FF] to-[#00FF41] bg-clip-text text-transparent">
                  {stat.label}
                </div>
                <div className="text-slate-500">{stat.desc}</div>
              </div>
            ))}
          </div>
          <div className="fade-in mt-12">
            <button
              onClick={scrollToTutorial}
              className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              Learn how it works <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      <section ref={tutorialRef} className="relative z-10 px-4 py-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How to Use NEXT Intelligence</h2>
            <p className="text-slate-400">Get started in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: User, title: 'Create Account', desc: 'Sign up and set monitoring preferences.' },
              { step: '02', icon: Database, title: 'Start Scanning', desc: 'Add paste URLs or search for threats.' },
              { step: '03', icon: Bell, title: 'Get Results', desc: 'Receive instant threat detection results.' }
            ].map((item, i) => (
              <GlassCard key={i} className="p-6 space-y-4" hover gradient>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold bg-gradient-to-br from-[#00F2FF]/30 to-[#00FF41]/30 bg-clip-text text-transparent">
                    {item.step}
                  </div>
                  <div className="p-3 bg-gradient-to-br from-[#00F2FF]/10 to-[#00FF41]/10 rounded-lg">
                    <item.icon className="w-6 h-6 text-[#00FF41]" />
                  </div>
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </GlassCard>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={() => setView('register')}
              className="px-6 py-3 bg-gradient-to-br from-[#00F2FF] to-[#00FF41] text-black font-bold rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              Get Started Now <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
