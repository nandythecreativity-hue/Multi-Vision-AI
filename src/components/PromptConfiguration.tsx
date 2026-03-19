import React from 'react';
import { Type, Loader2, Wand2, Sparkles } from 'lucide-react';
import { STYLE_PRESETS } from '../constants';

interface PromptConfigProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isEnhancing: boolean;
  isSuggesting: boolean;
  isGenerating: boolean;
  enhancePrompt: () => void;
  generatePromptIdea: () => void;
  applyStylePreset: (prompt: string) => void;
}

export const PromptConfiguration: React.FC<PromptConfigProps> = ({
  prompt,
  setPrompt,
  isEnhancing,
  isSuggesting,
  isGenerating,
  enhancePrompt,
  generatePromptIdea,
  applyStylePreset
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/60">
          <Type className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-widest">Prompt Configuration</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={enhancePrompt}
            disabled={isEnhancing || isGenerating || !prompt.trim()}
            className="group relative flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl border border-blue-500/20 transition-all text-[10px] font-black uppercase tracking-widest overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3 group-hover:rotate-12 transition-transform" />}
            Magic Enhance
          </button>
          <button 
            onClick={generatePromptIdea}
            disabled={isSuggesting || isGenerating}
            className="group relative flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-xl border border-orange-500/20 transition-all text-[10px] font-black uppercase tracking-widest overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />}
            Magic Suggest
          </button>
        </div>
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your video vision... (Supports plain text or JSON format)"
        className="w-full h-32 glass-input p-4 text-sm resize-none placeholder:text-white/20"
      />
      
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Style Presets</p>
        <div className="flex flex-wrap gap-2">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyStylePreset(preset.prompt)}
              className="px-3 py-1.5 glass-button text-[10px] font-bold flex items-center gap-2 hover:border-orange-500/50 transition-all"
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
