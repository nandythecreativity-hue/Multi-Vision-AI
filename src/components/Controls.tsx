import React from 'react';
import { motion } from 'motion/react';
import { 
  UserCircle2, 
  RefreshCw, 
  User, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  Smartphone,
  Palette,
  Camera,
  Layout,
  Sparkles
} from 'lucide-react';
import { 
  ANIMATION_STYLES, 
  CAMERA_STYLES, 
  SCENE_TYPES, 
  LIGHTING_STYLES,
  CHARACTER_AGES, 
  CHARACTER_POSES,
  CAMERA_STYLE_DESCRIPTIONS
} from '../constants';
import { CharacterModel, Product, AspectRatio } from '../types';

interface ControlsProps {
  characterModel: CharacterModel;
  setCharacterModel: (m: CharacterModel) => void;
  characterAge: string;
  setCharacterAge: (a: string) => void;
  characterPose: string;
  setCharacterPose: (p: string) => void;
  products: Product[];
  newProduct: string;
  setNewProduct: (p: string) => void;
  newProductImage: string | null;
  productFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleProductImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addProduct: () => void;
  removeProduct: (i: number) => void;
  autoAddProduct: boolean;
  setAutoAddProduct: (v: boolean) => void;
  images: string[];
  removeImage: (i: number) => void;
  addImage: (url: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (r: AspectRatio) => void;
  animationStyle: string;
  setAnimationStyle: (s: string) => void;
  cameraStyle: string;
  setCameraStyle: (s: string) => void;
  sceneType: string;
  setSceneType: (s: string) => void;
  lightingStyle: string;
  setLightingStyle: (s: string) => void;
  resolution: string;
  setResolution: (r: any) => void;
  numOutputs: number;
  setNumOutputs: (n: number) => void;
  mode: string;
}

export const Controls: React.FC<ControlsProps> = ({
  characterModel,
  setCharacterModel,
  characterAge,
  setCharacterAge,
  characterPose,
  setCharacterPose,
  products,
  newProduct,
  setNewProduct,
  newProductImage,
  productFileInputRef,
  handleProductImageUpload,
  addProduct,
  removeProduct,
  autoAddProduct,
  setAutoAddProduct,
  images,
  removeImage,
  addImage,
  fileInputRef,
  handleImageUpload,
  aspectRatio,
  setAspectRatio,
  animationStyle,
  setAnimationStyle,
  cameraStyle,
  setCameraStyle,
  sceneType,
  setSceneType,
  lightingStyle,
  setLightingStyle,
  resolution,
  setResolution,
  numOutputs,
  setNumOutputs,
  mode
}) => {
  return (
    <div className="space-y-8">
      {/* Style Config */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/40">
            <Palette className="w-3 h-3" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest">Style</h2>
          </div>
          <select 
            value={animationStyle}
            onChange={(e) => setAnimationStyle(e.target.value)}
            className="w-full glass-input px-3 py-2 text-xs font-bold appearance-none cursor-pointer"
          >
            {ANIMATION_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/40">
            <Camera className="w-3 h-3" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest">Camera</h2>
          </div>
          <select 
            value={cameraStyle}
            onChange={(e) => setCameraStyle(e.target.value)}
            className="w-full glass-input px-3 py-2 text-xs font-bold appearance-none cursor-pointer"
          >
            {CAMERA_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {CAMERA_STYLE_DESCRIPTIONS[cameraStyle] && (
            <p className="text-[9px] text-white/30 italic leading-tight mt-1">
              {CAMERA_STYLE_DESCRIPTIONS[cameraStyle]}
            </p>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/40">
            <Layout className="w-3 h-3" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest">Scene</h2>
          </div>
          <select 
            value={sceneType}
            onChange={(e) => setSceneType(e.target.value)}
            className="w-full glass-input px-3 py-2 text-xs font-bold appearance-none cursor-pointer"
          >
            {SCENE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/40">
            <Sparkles className="w-3 h-3" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest">Lighting</h2>
          </div>
          <select 
            value={lightingStyle}
            onChange={(e) => setLightingStyle(e.target.value)}
            className="w-full glass-input px-3 py-2 text-xs font-bold appearance-none cursor-pointer"
          >
            {LIGHTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </section>

      {/* Number of Outputs (Image Mode Only) */}
      {mode !== 'video' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white/40">
            <Layout className="w-3 h-3" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest">Number of Outputs</h2>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setNumOutputs(num)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  numOutputs === num 
                    ? 'bg-cyber-cyan border-cyber-cyan text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Character Model Selection */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-white/60">
          <UserCircle2 className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-widest">Character Configuration</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['none', 'male', 'female'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setCharacterModel(m)}
              className={`py-3 rounded-2xl text-[10px] font-bold border transition-all flex flex-col items-center gap-2 ${
                characterModel === m 
                  ? 'bg-cyber-cyan border-cyber-cyan text-black shadow-[0_0_20px_rgba(0,243,255,0.4)]' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              {m === 'none' && <RefreshCw className="w-4 h-4" />}
              {m === 'male' && <User className="w-4 h-4" />}
              {m === 'female' && <User className="w-4 h-4" />}
              <span className="capitalize">{m === 'none' ? 'Default' : `Realistic ${m}`}</span>
            </button>
          ))}
        </div>
        
        {characterModel !== 'none' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-white/40">Age Group</p>
              <select 
                value={characterAge}
                onChange={(e) => setCharacterAge(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs font-bold appearance-none cursor-pointer"
              >
                {CHARACTER_AGES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-white/40">Pose / Action</p>
              <select 
                value={characterPose}
                onChange={(e) => setCharacterPose(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs font-bold appearance-none cursor-pointer"
              >
                {CHARACTER_POSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Product Management */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/60">
            <ShoppingBag className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Product Catalog</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-white/40">Auto Add</span>
            <button 
              onClick={() => setAutoAddProduct(!autoAddProduct)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoAddProduct ? 'bg-cyber-cyan shadow-[0_0_10px_rgba(0,243,255,0.4)]' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: autoAddProduct ? 18 : 2 }}
                className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <div 
              onClick={() => productFileInputRef.current?.click()}
              className={`w-10 h-10 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden flex-shrink-0 ${
                newProductImage ? 'border-cyber-cyan/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'border-white/10 hover:border-white/20'
              }`}
            >
              {newProductImage ? (
                <img src={newProductImage || null} alt="New Product" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-4 h-4 text-white/20" />
              )}
            </div>
            <input 
              type="file"
              ref={productFileInputRef}
              onChange={handleProductImageUpload}
              className="hidden"
              accept="image/*"
            />
            <input 
              type="text"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProduct()}
              placeholder="Add product name (e.g. Luxury Watch)"
              className="flex-1 glass-input px-4 py-2 text-xs"
            />
            <button 
              onClick={addProduct}
              className="p-2 bg-cyber-cyan text-black rounded-xl hover:bg-cyber-cyan/80 transition-colors shadow-[0_0_10px_rgba(0,243,255,0.4)]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {products.map((p, i) => (
              <div 
                key={i} 
                onClick={() => {
                  if (p.image) {
                    if (images.includes(p.image)) {
                      removeImage(images.indexOf(p.image));
                    } else if (images.length < 5) {
                      addImage(p.image);
                    }
                  }
                }}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                  images.includes(p.image || '') ? 'border-cyber-cyan bg-cyber-cyan/5 shadow-[0_0_10px_rgba(0,243,255,0.1)]' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-white/5">
                  {p.image ? (
                    <img src={p.image || null} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20 font-black">N/A</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white/80 truncate">{p.name}</p>
                  {images.includes(p.image || '') && <p className="text-[8px] text-cyber-cyan font-black uppercase drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">Active Ref</p>}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProduct(i);
                  }}
                  className="text-white/20 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-[10px] text-white/20 italic col-span-2">No products added yet.</p>
            )}
          </div>
        </div>
      </section>

      {mode !== 'text-to-image' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <ImageIcon className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Reference Images ({images.length}/5)</h2>
            </div>
            {images.length < 5 && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-cyber-cyan uppercase tracking-widest hover:text-cyber-cyan/80 transition-colors flex items-center gap-1 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]"
              >
                <Plus className="w-3 h-3" /> Add Image
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-video rounded-xl border border-white/10 overflow-hidden group"
              >
                <img src={img} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => removeImage(idx)}
                    className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
            
            {images.length < 5 && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-cyber-cyan/30 hover:bg-cyber-cyan/5 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <Upload className="w-5 h-5 text-white/20 group-hover:text-cyber-cyan transition-colors" />
                <span className="text-[9px] font-bold text-white/20 group-hover:text-cyber-cyan uppercase tracking-widest">Upload Ref</span>
              </button>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
        </section>
      )}

      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Aspect Ratio</h2>
          <div className="flex flex-wrap gap-2">
            {(mode === 'video' ? ['16:9', '9:16'] as AspectRatio[] : ['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2 ${
                  aspectRatio === ratio 
                    ? 'bg-cyber-cyan border-cyber-cyan text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                {ratio === '9:16' && <Smartphone className="w-3 h-3" />}
                {ratio}
                {ratio === '9:16' && <span className="opacity-50">Android</span>}
                {ratio === '16:9' && <span className="opacity-50">Desktop</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Quality</h2>
          <div className="flex gap-2">
            {(mode === 'video' ? ['720p', '1080p'] : ['1K', '2K', '4K']).map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  resolution === res 
                    ? 'bg-cyber-cyan border-cyber-cyan text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
