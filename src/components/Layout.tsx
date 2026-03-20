import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Settings as SettingsIcon, 
  History, 
  LogOut, 
  Zap, 
  Menu, 
  X, 
  ChevronRight, 
  Bell, 
  Search,
  User,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  MessageSquare,
  Image as ImageIcon,
  Video
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { auth, logout } from '../firebase';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'AI Generator', path: '/generate', icon: Sparkles },
    { label: 'Activity Logs', path: '/logs', icon: History },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex overflow-hidden">
      {/* Sidebar (Desktop) */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="hidden lg:flex flex-col border-r border-white/5 bg-zinc-900/50 backdrop-blur-xl z-30 relative"
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="h-6 w-6 text-black" />
            </div>
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-lg font-bold tracking-tight whitespace-nowrap"
                >
                  Multy Vision AI
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative
                ${isActive ? 'bg-white text-black font-bold shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}
              `}
            >
              <item.icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110`} />
              <AnimatePresence mode="wait">
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {location.pathname === item.path && !isSidebarOpen && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white rounded-r-full" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
              {auth.currentUser?.photoURL ? (
                <img src={auth.currentUser.photoURL} alt="User" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-zinc-500" />
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{auth.currentUser?.displayName || 'User'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{auth.currentUser?.email}</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all group ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
            {isSidebarOpen && <span className="text-sm font-bold">Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-4 top-24 h-8 w-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all shadow-xl z-50"
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 border-b border-white/5 bg-zinc-900/30 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-black" />
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search tools, history, or settings..."
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-[#0a0a0a]" />
            </button>
            <div className="h-10 w-[1px] bg-white/5 mx-2 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Zap className="h-4 w-4" />
              450 Credits
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 h-full w-full max-w-[300px] bg-zinc-900 z-[70] lg:hidden flex flex-col p-6 border-r border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Zap className="h-6 w-6 text-black" />
                  </div>
                  <span className="text-lg font-bold">Multy Vision AI</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 space-y-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-4 px-5 py-4 rounded-2xl transition-all
                      ${isActive ? 'bg-white text-black font-bold' : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-base">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="pt-8 border-t border-white/5 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                    {auth.currentUser?.photoURL ? (
                      <img src={auth.currentUser.photoURL} alt="User" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{auth.currentUser?.displayName || 'User'}</p>
                    <p className="text-xs text-zinc-500 truncate">{auth.currentUser?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-bold"
                >
                  <LogOut className="h-6 w-6" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
