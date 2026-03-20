import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Calendar,
  Clock,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const fetchLogs = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      let q = query(
        collection(db, 'activity_logs'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      if (filterType !== 'all') {
        q = query(
          collection(db, 'activity_logs'),
          where('userId', '==', auth.currentUser.uid),
          where('type', '==', filterType),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(q);
      const fetchedLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'activity_logs', id));
      setLogs(logs.filter(log => log.id !== id));
    } catch (err) {
      console.error('Error deleting log:', err);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Activity Logs</h1>
          <p className="text-zinc-400 mt-1">Review and manage your past AI generations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <History className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
            <Zap className="h-4 w-4" />
            1,284 Total
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompts..."
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-zinc-900/50 border border-white/5 rounded-2xl">
          {[
            { label: 'All', value: 'all' },
            { label: 'Images', value: 'image' },
            { label: 'Videos', value: 'video' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value as any)}
              className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${
                filterType === type.value
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Preview</th>
                <th className="px-8 py-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Prompt & Details</th>
                <th className="px-8 py-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</th>
                <th className="px-8 py-5 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-8 py-5 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-zinc-500">
                      <div className="h-12 w-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                      <p className="text-sm font-medium animate-pulse">Loading activity logs...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-black border border-white/10">
                      <img src={log.resultUrl} alt="Preview" className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                  <td className="px-8 py-6 max-w-md">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white line-clamp-1 group-hover:line-clamp-none transition-all">{log.prompt}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-amber-500" />
                          {log.model || 'Gemini 2.5'}
                        </span>
                        <span>•</span>
                        <span>{log.ratio || '1:1'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      log.type === 'image' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {log.type === 'image' ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                      {log.type}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-white">
                        <Calendar className="h-3 w-3 text-zinc-500" />
                        {log.createdAt?.toDate().toLocaleDateString() || 'Today'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <Clock className="h-3 w-3" />
                        {log.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2.5 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-all">
                        <Download className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(log.id)}
                        className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-6 text-zinc-600 max-w-xs mx-auto">
                      <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5">
                        <History className="h-10 w-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-zinc-400">No Activity Found</h3>
                        <p className="text-xs leading-relaxed">
                          Your generation history will appear here once you start creating magic with our AI tools.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-6 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
          <p className="text-xs text-zinc-500 font-medium">Showing 1-20 of 1,284 entries</p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors disabled:opacity-50" disabled>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3, '...', 64].map((page, i) => (
                <button 
                  key={i}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                    page === 1 ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
