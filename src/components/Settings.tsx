import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Trash2, 
  Eye, 
  EyeOff,
  CreditCard,
  ChevronRight,
  Info,
  Lock,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedKeyExists, setSavedKeyExists] = useState(false);
  const [isKeyActive, setIsKeyActive] = useState(true);

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const fetchKeyStatus = async () => {
    if (!auth.currentUser) return;
    try {
      const keyDoc = await getDoc(doc(db, 'api_keys', auth.currentUser.uid));
      if (keyDoc.exists()) {
        setSavedKeyExists(true);
        setIsKeyActive(keyDoc.data().isActive ?? true);
      }
    } catch (err) {
      console.error('Error fetching key status:', err);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim() || !auth.currentUser) return;
    setIsSaving(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // 1. Encrypt key on backend
      const response = await axios.post('/api/keys/encrypt', {
        apiKey: apiKey.trim(),
        userId: auth.currentUser.uid
      });

      if (response.data.success) {
        // 2. Save encrypted key reference in Firestore
        await setDoc(doc(db, 'api_keys', auth.currentUser.uid), {
          userId: auth.currentUser.uid,
          encryptedKey: response.data.encryptedKey,
          isActive: true,
          updatedAt: serverTimestamp(),
        });

        setSavedKeyExists(true);
        setIsKeyActive(true);
        setApiKey('');
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err: any) {
      console.error('Error saving key:', err);
      setStatus('error');
      setErrorMessage(err.response?.data?.error || 'Failed to save API key.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!auth.currentUser) return;
    setIsDeleting(true);
    try {
      await updateDoc(doc(db, 'api_keys', auth.currentUser.uid), {
        encryptedKey: null,
        isActive: false,
        updatedAt: serverTimestamp(),
      });
      setSavedKeyExists(false);
      setIsKeyActive(false);
    } catch (err) {
      console.error('Error deleting key:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleKeyStatus = async () => {
    if (!auth.currentUser) return;
    const newStatus = !isKeyActive;
    setIsKeyActive(newStatus);
    try {
      await updateDoc(doc(db, 'api_keys', auth.currentUser.uid), {
        isActive: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error toggling key status:', err);
      setIsKeyActive(!newStatus); // Rollback
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your account, API keys, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* API Key Management */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Key className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">API Configuration</h2>
          </div>

          <div className="p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bring Your Own Key (BYOK)</label>
                  <p className="text-sm text-zinc-400">
                    Use your own Google Gemini API key to bypass platform limits and use your own credits.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input 
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={savedKeyExists ? "••••••••••••••••" : "Enter your Gemini API Key"}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-12 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 hover:text-white transition-colors"
                  >
                    {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleSaveKey}
                    disabled={isSaving || !apiKey.trim()}
                    className="px-8 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {savedKeyExists ? 'Update Key' : 'Save Securely'}
                  </button>
                  {savedKeyExists && (
                    <button 
                      onClick={handleDeleteKey}
                      disabled={isDeleting}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                      <CheckCircle2 className="h-4 w-4" /> API Key saved and encrypted successfully.
                    </motion.div>
                  )}
                  {status === 'error' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-red-400 text-xs font-medium">
                      <AlertCircle className="h-4 w-4" /> {errorMessage}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-full md:w-72 space-y-4">
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Status</span>
                    <div className={`h-2 w-2 rounded-full ${savedKeyExists ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Use Personal Key</span>
                    <button 
                      onClick={toggleKeyStatus}
                      disabled={!savedKeyExists}
                      className={`relative w-12 h-6 rounded-full transition-colors ${isKeyActive && savedKeyExists ? 'bg-emerald-500' : 'bg-zinc-700'} ${!savedKeyExists && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${isKeyActive && savedKeyExists ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 leading-relaxed">
                      <Info className="h-3 w-3 shrink-0" />
                      When disabled, the system will automatically use the fallback API.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Subscription & Billing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm space-y-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Plan</h4>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-white">Pro Monthly</h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">Active</span>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Your next billing date is April 20, 2026 for $29.00.
              </p>
              <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                <span className="text-sm font-bold text-white">Manage Subscription</span>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 space-y-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Usage This Month</h4>
                <h3 className="text-2xl font-bold text-white">1,284 / 2,000</h3>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '64.2%' }} />
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-zinc-500">64% of credits used</span>
                <button className="text-emerald-400 hover:text-emerald-300 transition-colors">Buy More Credits</button>
              </div>
            </div>
          </div>
        </section>

        {/* Security Info */}
        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 h-fit">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-400">Enterprise-Grade Security</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Your API keys are encrypted using AES-256-CBC before being stored in our database. We never store raw keys, and they are only decrypted on the server-side during generation requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
