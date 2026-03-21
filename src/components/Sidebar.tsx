import React from 'react';
import { motion } from 'motion/react';
import { 
  Video, 
  ImageIcon, 
  History, 
  Shield, 
  Sparkles,
  Wand2,
  Layout
} from 'lucide-react';
import { AppMode } from '../types';

interface SidebarProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isAdmin: boolean;
  onReset: () => void;
  viewMode: 'auto' | 'portrait' | 'desktop';
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  mode, 
  setMode, 
  isAdmin,
  onReset,
  viewMode
}) => {
  const modes: { id: AppMode; label: string; icon: any }[] = [
    { id: 'video', label: 'Video Generation', icon: Video },
    { id: 'text-to-image', label: 'Text to Image', icon: Wand2 },
    { id: 'image-to-image', label: 'Image to Image', icon: ImageIcon },
    { id: 'history', label: 'History', icon: History },
  ];

  if (isAdmin) {
    modes.push({ id: 'admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <aside className={`${viewMode === 'portrait' ? 'flex w-16 sm:w-72' : 'hidden lg:flex w-72'} flex-col border-r border-cyber-cyan/10 bg-cyber-bg/80 backdrop-blur-xl sticky top-0 h-screen p-3 sm:p-6 gap-8 z-50 transition-all duration-300`}>
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 cursor-pointer overflow-hidden group/logo"
        onClick={onReset}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-cyber-cyan to-cyber-magenta rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.4)] shrink-0 group-hover/logo:shadow-[0_0_30px_rgba(255,0,255,0.6)] transition-all duration-500">
          <Sparkles className="w-6 h-6 text-black" />
        </div>
        <div className={`${viewMode === 'portrait' ? 'hidden sm:block' : 'block'} glitch-hover`}>
          <p className="text-[7px] font-black text-cyber-cyan/50 uppercase tracking-[0.3em] mb-0.5">Creator : Nandiarzhanka</p>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Vision<span className="neon-text-magenta">AI</span></h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold mt-1">Cyber Suite Pro</p>
        </div>
      </motion.div>

      <nav className="flex flex-col gap-2">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 px-4 ${viewMode === 'portrait' ? 'hidden sm:block' : 'block'}`}>Navigation</p>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-4 px-3 sm:px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative group ${
              mode === m.id 
                ? (m.id === 'admin' ? 'text-black' : 'text-black') 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
            title={m.label}
          >
            {mode === m.id && (
              <motion.div 
                layoutId="sidebar-nav-pill"
                className={`absolute inset-0 rounded-2xl shadow-[0_0_20px_rgba(0,243,255,0.4)] ${
                  m.id === 'admin' ? 'bg-cyber-magenta shadow-[0_0_20px_rgba(255,0,255,0.4)]' : 'bg-cyber-cyan'
                }`}
              />
            )}
            <m.icon className={`w-4 h-4 relative z-10 shrink-0 ${
              mode === m.id 
                ? 'text-black' 
                : (m.id === 'admin' ? 'text-cyber-magenta group-hover:text-cyber-magenta' : 'text-white/20 group-hover:text-cyber-cyan')
            } transition-colors`} />
            <span className={`relative z-10 truncate ${viewMode === 'portrait' ? 'hidden sm:block' : 'block'}`}>{m.label}</span>
            {m.id === 'admin' && (
              <span className="ml-auto px-1.5 py-0.5 bg-cyber-magenta text-black text-[7px] font-black rounded-sm uppercase tracking-tighter shadow-[0_0_10px_rgba(255,0,255,0.4)] relative z-10">ADMIN</span>
            )}
            {m.id === 'admin' && mode !== 'admin' && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyber-magenta rounded-full animate-ping" />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <div className={`p-4 bg-white/[0.02] border border-cyber-cyan/20 rounded-2xl shadow-[inset_0_0_10px_rgba(0,243,255,0.1)] ${viewMode === 'portrait' ? 'hidden sm:block' : 'block'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Layout className="w-3.5 h-3.5 text-cyber-magenta" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Cyber Workspace</p>
          </div>
          <p className="text-[9px] text-white/30 leading-relaxed font-medium">
            Neural AI models active. Cyber-link established.
          </p>
        </div>
        <div className={`sm:hidden flex justify-center ${viewMode === 'portrait' ? 'block' : 'hidden'}`}>
           <Layout className="w-4 h-4 text-cyber-magenta opacity-40" />
        </div>
      </div>
    </aside>
  );
};
