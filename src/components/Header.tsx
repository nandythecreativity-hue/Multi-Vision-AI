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
  isAdmin: boolean;
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
  onOpenSettings,
  isAdmin
}) => {
  const modes: AppMode[] = ['video', 'text-to-image', 'image-to-image', 'history'];
  if (isAdmin) modes.push('admin');

  return (
    <header className="border-b border-white/5 p-3 sm:p-4 sticky top-0 bg-[#050505]/60 backdrop-blur-2xl z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Mobile Logo Only */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex lg:hidden items-center gap-2 cursor-pointer shrink-0"
          onClick={onReset}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Video className="w-4 h-4 text-black" />
          </div>
          <div>
            <p className="text-[6px] font-black text-orange-500/50 uppercase tracking-[0.2em]">Creator : Nandiarzhanka</p>
            <h1 className="text-sm font-black tracking-tighter uppercase leading-none">Vision<span className="text-orange-500">AI</span></h1>
          </div>
        </motion.div>
        
        {/* Mobile Navigation Only */}
        <nav className="flex lg:hidden items-center bg-white/5 rounded-xl p-0.5 border border-white/10 backdrop-blur-md overflow-x-auto no-scrollbar flex-1 justify-center mx-2">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-300 relative whitespace-nowrap ${
                mode === m ? 'text-black' : 'text-white/40'
              }`}
            >
              {mode === m && (
                <motion.div 
                  layoutId="nav-pill-mobile"
                  className="absolute inset-0 bg-orange-500 rounded-lg"
                />
              )}
              <span className="relative z-10">{m.replace(/-/g, ' ')}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
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
                <div className="flex items-center gap-1.5">
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 bg-orange-500 text-black text-[7px] font-black rounded-sm uppercase tracking-tighter">ADMIN</span>
                  )}
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Operator</span>
                </div>
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
