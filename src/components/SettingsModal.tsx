import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Settings, Users } from 'lucide-react';

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  credits: number;
  isAdmin: boolean;
  user: any;
  handleTopUp: () => void;
  handleSelectKey: () => void;
  manualApiKey: string;
  setManualApiKey: (key: string) => void;
  handleSaveManualKey: () => void;
  handleClearKeys: () => void;
  targetEmail: string;
  setTargetEmail: (email: string) => void;
  targetAmount: number;
  setTargetAmount: (amount: number) => void;
  handleAdminAddCredits: () => void;
  adminActionLoading: boolean;
  setMode: (mode: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  show,
  onClose,
  credits,
  isAdmin,
  user,
  handleTopUp,
  handleSelectKey,
  manualApiKey,
  setManualApiKey,
  handleSaveManualKey,
  handleClearKeys,
  targetEmail,
  setTargetEmail,
  targetAmount,
  setTargetAmount,
  handleAdminAddCredits,
  adminActionLoading,
  setMode
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl"
          >
            <h2 className="text-xl font-bold">API Key & Credits</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-2">
                <p className="text-xs text-orange-500 font-bold uppercase tracking-wider">Credit Info</p>
                <p className="text-sm text-white/60">
                  {isAdmin 
                    ? "You are an Admin. You can top up credits for testing." 
                    : "Credits are now managed via your account. Login to sync your balance."}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Coins className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-black text-white">{credits} Credits Available</span>
                </div>
                {!user && (
                  <p className="text-[10px] text-red-400 font-bold uppercase">Login required to see credits</p>
                )}
              </div>

              {isAdmin && (
                  <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Admin Controls</p>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setMode('admin');
                          onClose();
                        }}
                        className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 border border-orange-500/30 font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                      >
                        <Users className="w-4 h-4" />
                        OPEN USER MANAGEMENT
                      </button>
                      <button
                        onClick={handleTopUp}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                      >
                        <Coins className="w-4 h-4" />
                        TOP UP +50 CREDITS (SELF)
                      </button>
                    </div>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Add Credits to User</p>
                    <div className="space-y-2">
                      <input 
                        type="email"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        placeholder="User Email..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          value={targetAmount}
                          onChange={(e) => setTargetAmount(parseInt(e.target.value) || 0)}
                          placeholder="Amount..."
                          className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50"
                        />
                        <button
                          onClick={handleAdminAddCredits}
                          disabled={adminActionLoading || !targetEmail}
                          className="flex-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-xs"
                        >
                          {adminActionLoading ? "PROCESSING..." : "ADD CREDITS"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Platform Selection</p>
                <button
                  onClick={handleSelectKey}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl transition-all"
                >
                  Select Paid Key (Recommended)
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Manual Input</p>
                <input 
                  type="password"
                  value={manualApiKey}
                  onChange={(e) => setManualApiKey(e.target.value)}
                  placeholder="Enter API Key manually..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50"
                />
                <button
                  onClick={handleSaveManualKey}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Save Manual Key
                </button>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={handleClearKeys}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl transition-all text-xs"
                >
                  RESET ALL API KEYS
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-2 text-xs text-white/40 hover:text-white transition-colors"
            >
              Close Settings
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
