import React from 'react';
import { motion } from 'motion/react';
import { Video, LogIn, LogOut, Smartphone, Monitor, Layout, Coins, Settings } from 'lucide-react';
import { AppMode } from '../types';
import { FirebaseUser } from '../firebase';

interface HeaderProps {
  user: FirebaseUser | null;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  loginWithGoogle: () => void;
  isLoggingIn: boolean;
  logout: () => void;
  onReset: () => void;
  viewMode: 'auto' | 'portrait' | 'desktop';
  setViewMode: (mode: 'auto' | 'portrait' | 'desktop') => void;
  credits: number;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  mode, 
  setMode, 
  loginWithGoogle, 
  isLoggingIn,
  logout, 
  onReset,
  viewMode,
  setViewMode,
  credits,
  onOpenSettings
}) => {
  return (
    <header className="border-b border-white/5 p-3 sm:p-6 sticky top-0 bg-[#050505]/60 backdrop-blur-2xl z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 lg:gap-3 cursor-pointer shrink-0"
          onClick={onReset}
        >
          <div className="w-8 h-8 lg:w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Video className="w-4 h-4 lg:w-6 h-6 text-black relative z-10" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base lg:text-xl font-black tracking-tighter uppercase leading-none">Vision<span className="text-orange-500">AI</span></h1>
            <p className="text-[7px] lg:text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold mt-1">Creative Suite Pro</p>
          </div>
        </motion.div>
        
        <nav className="flex items-center bg-white/5 rounded-xl lg:rounded-2xl p-0.5 lg:p-1 border border-white/10 backdrop-blur-md overflow-x-auto no-scrollbar flex-1 justify-center min-w-0">
          {(['video', 'text-to-image', 'image-to-image', 'history'] as AppMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 lg:px-5 py-2 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group whitespace-nowrap ${
                mode === m ? 'text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              {mode === m && (
                <motion.div 
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20"
                />
              )}
              <span className="relative z-10">{m.replace(/-/g, ' ')}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Credits Display */}
          {user && (
            <button 
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-all group"
            >
              <Coins className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-orange-500">{credits}</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 mr-2">
            <button 
              onClick={() => setViewMode('auto')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'auto' ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white'}`}
              title="Auto Layout"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('portrait')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'portrait' ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white'}`}
              title="Portrait Mode"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white'}`}
              title="Desktop Mode"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Operator</span>
                <span className="text-xs font-bold text-white/80">{user.displayName || user.email?.split('@')[0]}</span>
              </div>
              <button 
                onClick={onOpenSettings}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/30 hover:text-white border border-white/5"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={logout}
                className="p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all text-white/30 hover:text-red-500 border border-white/5"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-black text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {isLoggingIn ? '...' : 'LOGIN'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
