import React from 'react';
import { motion } from 'motion/react';
import { History, Play, ImageIcon, Download, Trash2, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { HistoryItem, AppMode } from '../types';

interface HistoryViewProps {
  history: HistoryItem[];
  onDelete: (id: string) => void;
  onReopen: (item: HistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onDelete, onReopen }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Generation History</h2>
            <p className="text-sm text-white/40">Your creative journey, preserved.</p>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white/5 rounded-[32px] border border-white/10 border-dashed">
          <History className="w-12 h-12 text-white/10 mb-4" />
          <p className="text-white/40 font-medium">No history found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group bg-white/5 border border-white/10 rounded-[32px] overflow-hidden hover:border-orange-500/30 transition-all shadow-xl"
            >
              <div className="relative aspect-video bg-black">
                {item.type === 'video' ? (
                  <video 
                    src={item.url || null} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                    muted
                    loop
                    onMouseOver={(e) => {
                      const playPromise = e.currentTarget.play();
                      if (playPromise !== undefined) {
                        playPromise.catch(() => {
                          // Playback was interrupted or failed
                        });
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.pause();
                    }}
                  />
                ) : (
                  <img src={item.url || null} alt={item.prompt} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="absolute top-4 left-4">
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    {item.type === 'video' ? <Play className="w-3 h-3 text-orange-500" /> : <ImageIcon className="w-3 h-3 text-blue-500" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.type}</span>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500 text-white rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-white/60 line-clamp-2 font-medium leading-relaxed italic">"{item.prompt}"</p>
                <div className="flex items-center justify-between text-[10px] text-white/30 font-bold uppercase tracking-widest">
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  <a 
                    href={item.url} 
                    download 
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                </div>
                {item.type === 'video' && item.operation && (
                  <button 
                    onClick={() => onReopen(item)}
                    className="w-full mt-2 py-2 glass-button text-[10px] font-black uppercase tracking-widest"
                  >
                    Re-open in Editor
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
