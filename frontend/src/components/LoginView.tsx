import { useState, useEffect, useRef } from 'react';
import { Shield, Loader } from 'lucide-react';
import anime from 'animejs';
import { ArtisticBackground } from './ArtisticBackground';
import { GlassCard } from './GlassCard';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
  setView: (view: string) => void;
}

export function LoginView({ setView }: LoginViewProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  useEffect(() => {
    if (formRef.current) {
      anime({
        targets: formRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        easing: 'easeOutCubic'
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(formData.email, formData.password);
    
    if (!error) {
      setView('dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <ArtisticBackground />
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-gradient-to-br from-[#00FF41]/20 to-transparent rounded-full blur-3xl" />
      
      <div ref={formRef} className="relative z-10 w-full max-w-md">
        <GlassCard className="p-8" gradient>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#00F2FF]/20 to-[#00FF41]/20 mb-4">
              <Shield className="w-6 h-6 text-[#00FF41]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to your account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00FF41]/50 transition-colors backdrop-blur-xl"
                placeholder="agent@nexzy.io"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <input
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00FF41]/50 transition-colors backdrop-blur-xl"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-[#00F2FF] to-[#00FF41] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-6 flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <span className="text-sm text-slate-500">Don't have an account? </span>
            <button
              onClick={() => setView('register')}
              className="text-sm text-[#00FF41] hover:text-[#00cc33] transition-colors"
            >
              Sign up
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
