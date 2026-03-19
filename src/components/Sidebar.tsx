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
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  mode, 
  setMode, 
  isAdmin,
  onReset 
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
    <aside className="hidden lg:flex flex-col w-72 border-r border-white/5 bg-[#050505] sticky top-0 h-screen p-6 gap-8 z-50">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 cursor-pointer"
        onClick={onReset}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Sparkles className="w-6 h-6 text-black" />
        </div>
        <div>
          <p className="text-[7px] font-black text-orange-500/50 uppercase tracking-[0.3em] mb-0.5">Creator : Nandiarzhanka</p>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Vision<span className="text-orange-500">AI</span></h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold mt-1">Creative Suite Pro</p>
        </div>
      </motion.div>

      <nav className="flex flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 px-4">Navigation</p>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative group ${
              mode === m.id ? 'text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {mode === m.id && (
              <motion.div 
                layoutId="sidebar-nav-pill"
                className="absolute inset-0 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20"
              />
            )}
            <m.icon className={`w-4 h-4 relative z-10 ${mode === m.id ? 'text-black' : 'text-white/20 group-hover:text-orange-500'} transition-colors`} />
            <span className="relative z-10">{m.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Layout className="w-3.5 h-3.5 text-orange-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Pro Workspace</p>
          </div>
          <p className="text-[9px] text-white/30 leading-relaxed font-medium">
            Advanced AI models active. Ready for high-fidelity generation.
          </p>
        </div>
      </div>
    </aside>
  );
};
