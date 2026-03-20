import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Zap, 
  Download, 
  Share2, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  ChevronDown,
  Info,
  History,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import axios from 'axios';

const ASPECT_RATIOS = [
  { label: '1:1 Square', value: '1:1' },
  { label: '16:9 Landscape', value: '16:9' },
  { label: '9:16 Portrait', value: '9:16' },
  { label: '4:3 Classic', value: '4:3' },
  { label: '3:4 Portrait', value: '3:4' },
];

const MODELS = [
  { label: 'Gemini 2.5 Flash Image', value: 'gemini-2.5-flash-image', description: 'Fast and reliable image generation.' },
  { label: 'Gemini 3.1 Flash Image', value: 'gemini-3.1-flash-image-preview', description: 'High quality, detailed results.' },
];

export const Generate: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'activity_logs'),
        where('userId', '==', auth.currentUser.uid),
        where('type', '==', 'image'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(logs);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      // 1. Get API Key (User or Fallback)
      const response = await axios.post('/api/keys/decrypt', {
        userId: auth.currentUser?.uid
      });
      
      const apiKey = response.data.apiKey;
      if (!apiKey) throw new Error('No API key available. Please check your settings.');

      const ai = new GoogleGenAI({ apiKey });
      
      const genResponse = await ai.models.generateContent({
        model: selectedModel.value,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: selectedRatio.value as any,
          },
        },
      });

      let imageUrl = null;
      for (const part of genResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) throw new Error('Failed to generate image. No image data returned.');

      setResult(imageUrl);

      // 2. Log Activity
      if (auth.currentUser) {
        await addDoc(collection(db, 'activity_logs'), {
          userId: auth.currentUser.uid,
          prompt,
          resultUrl: imageUrl,
          type: 'image',
          model: selectedModel.value,
          ratio: selectedRatio.value,
          createdAt: serverTimestamp(),
        });
        fetchHistory();
      }

    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = `multy-vision-ai-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">AI Image Generator</h1>
          <p className="text-zinc-400 mt-1">Transform your ideas into stunning visuals in seconds.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <History className="h-4 w-4" />
            History
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
            <Zap className="h-4 w-4" />
            450 Credits
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm space-y-6">
            {/* Model Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Model</label>
              <div className="space-y-2">
                {MODELS.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => setSelectedModel(model)}
                    className={`w-full flex flex-col items-start p-4 rounded-2xl border transition-all text-left ${
                      selectedModel.value === model.value 
                        ? 'bg-emerald-500/10 border-emerald-500/50' 
                        : 'bg-black/20 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-sm font-bold ${selectedModel.value === model.value ? 'text-emerald-400' : 'text-white'}`}>
                        {model.label}
                      </span>
                      {selectedModel.value === model.value && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <span className="text-xs text-zinc-500 leading-relaxed">{model.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setSelectedRatio(ratio)}
                    className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedRatio.value === ratio.value
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                        : 'bg-black/20 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings Info */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-3">
              <Info className="h-5 w-5 text-zinc-500 shrink-0" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                Higher quality settings consume more credits. Gemini 3.1 provides more detailed textures and better prompt adherence.
              </p>
            </div>
          </div>
        </div>

        {/* Generation Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Prompt Input */}
          <div className="p-6 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm space-y-4">
            <div className="relative">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic cyberpunk city with neon lights and flying cars, cinematic lighting, 8k resolution..."
                className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-6 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button 
                  onClick={() => setPrompt('')}
                  className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all">
                  <Sparkles className="h-4 w-4" />
                  Enhance
                </button>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-white text-black font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Generate Image
                  <Sparkles className="h-4 w-4 transition-transform group-hover:scale-125" />
                </>
              )}
            </button>
          </div>

          {/* Result Display */}
          <div className="min-h-[500px] rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center relative overflow-hidden group">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full p-4 flex flex-col items-center justify-center gap-6"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 max-h-[600px]">
                    <img src={result} alt="Generated" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-8 gap-4">
                      <button 
                        onClick={handleDownload}
                        className="p-4 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all shadow-xl"
                      >
                        <Download className="h-6 w-6" />
                      </button>
                      <button className="p-4 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all shadow-xl">
                        <Share2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : isGenerating ? (
                <div className="flex flex-col items-center gap-4 text-zinc-500">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium animate-pulse">Our AI is painting your imagination...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-4 text-red-400 p-8 text-center max-w-md">
                  <AlertCircle className="h-12 w-12" />
                  <p className="text-sm font-medium">{error}</p>
                  <button 
                    onClick={handleGenerate}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 text-zinc-600 p-12 text-center max-w-md">
                  <div className="h-24 w-24 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-zinc-400">Ready to Create?</h3>
                    <p className="text-sm leading-relaxed">
                      Enter a detailed prompt and select your preferences to generate your first AI masterpiece.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* History Drawer (Simplified for UI) */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-white/10 z-50 p-8 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Recent Generations</h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"
              >
                <ChevronDown className="h-6 w-6 rotate-[-90deg]" />
              </button>
            </div>

            <div className="space-y-6">
              {history.length > 0 ? history.map((item) => (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-white/5 aspect-square bg-black">
                  <img src={item.resultUrl} alt={item.prompt} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white line-clamp-2 mb-2">{item.prompt}</p>
                    <button 
                      onClick={() => setResult(item.resultUrl)}
                      className="w-full py-2 rounded-lg bg-white text-black text-xs font-bold"
                    >
                      View Result
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 text-zinc-600">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No history found yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
