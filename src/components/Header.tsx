import React from 'react';
import { motion } from 'motion/react';
import { Video, LogIn, LogOut, Smartphone, Monitor, Layout, Coins, Settings, Image as ImageIcon, Film } from 'lucide-react';
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
  imageCredits: number;
  videoCredits: number;
  onOpenSettings: () => void;
  isAdmin: boolean;
  manualApiKey: string;
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
  imageCredits,
  videoCredits,
  onOpenSettings,
  isAdmin,
  manualApiKey
}) => {
  const modes: AppMode[] = ['video', 'text-to-image', 'image-to-image', 'history'];
  if (isAdmin) modes.push('admin');

  return (
    <header className="border-b border-cyber-cyan/10 p-3 sm:p-4 sticky top-0 bg-cyber-bg/60 backdrop-blur-2xl z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`${viewMode === 'portrait' ? 'hidden' : 'flex lg:hidden'} items-center gap-2 cursor-pointer shrink-0 group/logo`}
          onClick={onReset}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-cyber-cyan to-cyber-magenta rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover/logo:shadow-[0_0_25px_rgba(255,0,255,0.6)] transition-all">
            <Video className="w-4 h-4 text-black" />
          </div>
          <div className="glitch-hover">
            <p className="text-[6px] font-black text-cyber-cyan/50 uppercase tracking-[0.2em]">Creator : Nandiarzhanka</p>
            <h1 className="text-sm font-black tracking-tighter uppercase leading-none">Vision<span className="neon-text-magenta">AI</span></h1>
          </div>
        </motion.div>
        
        {/* Mobile Navigation Only */}
        <nav className={`${viewMode === 'portrait' ? 'hidden' : 'flex lg:hidden'} items-center bg-white/[0.02] rounded-xl p-0.5 border border-white/10 backdrop-blur-md overflow-x-auto no-scrollbar flex-1 justify-center mx-2`}>
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
                  className="absolute inset-0 bg-cyber-cyan shadow-[0_0_15px_rgba(0,243,255,0.4)] rounded-lg"
                />
              )}
              <span className="relative z-10">{m.replace(/-/g, ' ')}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          {/* BYOK Indicator */}
          {manualApiKey && (
            <div className="px-2 py-1 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-lg flex items-center gap-1.5 animate-pulse">
              <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full shadow-[0_0_5px_rgba(0,243,255,1)]" />
              <span className="text-[9px] font-black text-cyber-cyan uppercase tracking-wider">NEURAL LINK ACTIVE</span>
            </div>
          )}

          {/* Credits Display */}
          {user && !manualApiKey && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-lg hover:bg-cyber-cyan/20 transition-all group"
                title="Image Credits"
              >
                <ImageIcon className="w-3.5 h-3.5 text-cyber-cyan group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-cyber-cyan">{imageCredits}</span>
              </button>
              <button 
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-all group"
                title="Video Credits"
              >
                <Film className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-orange-500">{videoCredits}</span>
              </button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/[0.02] rounded-xl p-1 border border-white/10 mr-2">
            <button 
              onClick={() => setViewMode('auto')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'auto' ? 'bg-cyber-cyan text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]' : 'text-white/40 hover:text-white'}`}
              title="Auto Layout"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('portrait')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'portrait' ? 'bg-cyber-cyan text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]' : 'text-white/40 hover:text-white'}`}
              title="Portrait Mode"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-cyber-cyan text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]' : 'text-white/40 hover:text-white'}`}
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
                    <span className="px-1.5 py-0.5 bg-cyber-magenta text-black text-[7px] font-black rounded-sm uppercase tracking-tighter shadow-[0_0_10px_rgba(255,0,255,0.4)]">ADMIN</span>
                  )}
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Operator</span>
                </div>
                <span className="text-xs font-bold text-white/80">{user.displayName || user.email?.split('@')[0]}</span>
              </div>
              <button 
                onClick={onOpenSettings}
                className="p-2.5 bg-white/[0.02] hover:bg-white/10 rounded-xl transition-all text-white/30 hover:text-white border border-white/5"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={logout}
                className="p-2.5 bg-white/[0.02] hover:bg-red-500/10 rounded-xl transition-all text-white/30 hover:text-red-500 border border-white/5"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyber-cyan hover:bg-cyber-cyan/80 text-black font-black text-[10px] tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
