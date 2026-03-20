import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Mail, 
  Lock, 
  ArrowRight, 
  Chrome, 
  ShieldCheck, 
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loginWithGoogle } from '../firebase';

export const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-2xl shadow-emerald-500/20">
            <Zap className="h-10 w-10 text-black" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Multy Vision AI</h1>
          <p className="text-zinc-400">The next generation of AI content creation.</p>
        </div>

        <div className="rounded-3xl border border-white/5 bg-zinc-900/50 p-8 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                <input 
                  type="email"
                  placeholder="name@example.com"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                <input 
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <button className="w-full group relative overflow-hidden rounded-xl bg-white p-[1px] transition-all hover:shadow-lg hover:shadow-white/10">
            <div className="flex h-14 items-center justify-center gap-2 rounded-[11px] bg-zinc-900 px-8 text-sm font-bold transition-all group-hover:bg-transparent group-hover:text-black">
              Sign In
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <span className="relative bg-[#121212] px-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">Or continue with</span>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex h-14 items-center justify-center gap-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Chrome className="h-5 w-5" />
                Google Account
              </>
            )}
          </button>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Secure Session
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-cyan-500" />
            AI Powered
          </div>
        </div>
      </motion.div>
    </div>
  );
};
