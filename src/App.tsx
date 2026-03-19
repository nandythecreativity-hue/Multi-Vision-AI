/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import { 
  Video, 
  Upload, 
  Settings, 
  Play, 
  Download, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Maximize2,
  Type,
  Sparkles,
  Camera,
  Palette,
  Layout,
  Coins,
  RefreshCw,
  User,
  ShoppingBag,
  Plus,
  Trash2,
  UserCircle2,
  History,
  LogIn,
  LogOut,
  Smartphone,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  increment,
  query,
  where,
  getDocs,
  collection,
  FirebaseUser,
  handleFirestoreError,
  OperationType
} from './firebase';

import { AppMode, AspectRatio, HistoryItem, Product } from './types';
import { 
  ANIMATION_STYLES, 
  CAMERA_STYLES, 
  SCENE_TYPES, 
  LIGHTING_STYLES, 
  CHARACTER_POSES, 
  CHARACTER_AGES, 
  STYLE_PRESETS 
} from './constants';

// Types for AI Studio API Key Selection
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

import { Header } from './components/Header';
import { HistoryView } from './components/HistoryView';
import { PromptConfiguration } from './components/PromptConfiguration';
import { SettingsModal } from './components/SettingsModal';
import { Controls } from './components/Controls';
import { AdminDashboard } from './components/AdminDashboard';

type Resolution = '720p' | '1080p' | '1K' | '2K' | '4K';

export default function App() {
  const [mode, setMode] = useState<AppMode>('video');
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [scaleImage, setScaleImage] = useState(false);
  const [enableSound, setEnableSound] = useState(true);
  
  // New features: Character Models & Products
  const [characterModel, setCharacterModel] = useState<'none' | 'male' | 'female'>('none');
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState('');
  const [newProductImage, setNewProductImage] = useState<string | null>(null);
  const [autoAddProduct, setAutoAddProduct] = useState(false);
  const [productFidelity, setProductFidelity] = useState(true);

  const [animationStyle, setAnimationStyle] = useState(ANIMATION_STYLES[0]);
  const [cameraStyle, setCameraStyle] = useState(CAMERA_STYLES[0]);
  const [sceneType, setSceneType] = useState(SCENE_TYPES[0]);
  const [lightingStyle, setLightingStyle] = useState(LIGHTING_STYLES[0]);
  const [characterPose, setCharacterPose] = useState(CHARACTER_POSES[0]);
  const [characterAge, setCharacterAge] = useState(CHARACTER_AGES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [lastVideoOperation, setLastVideoOperation] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('vision_ai_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string>('');
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [generatedHashtags, setGeneratedHashtags] = useState<string>('');
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(60);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [viewMode, setViewMode] = useState<'auto' | 'portrait' | 'desktop'>('auto');
  
  const [showSettings, setShowSettings] = useState(false);
  const [manualApiKey, setManualApiKey] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'video') {
      if (resolution !== '720p' && resolution !== '1080p') {
        setResolution('1080p');
      }
    } else if (mode === 'text-to-image' || mode === 'image-to-image') {
      if (resolution === '720p' || resolution === '1080p') {
        setResolution('1K');
      }
    }
  }, [mode]);

  useEffect(() => {
    checkApiKey();
    const savedKey = localStorage.getItem('veo_manual_api_key');
    if (savedKey) setManualApiKey(savedKey);

    let unsubscribeCredits: (() => void) | null = null;

    // Firebase Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Unsubscribe from previous listener if it exists
      if (unsubscribeCredits) {
        unsubscribeCredits();
        unsubscribeCredits = null;
      }

      setUser(firebaseUser);
      setIsAuthReady(true);
      
      if (firebaseUser) {
        // Check if admin
        const adminEmail = "nandythecreativity@gmail.com";
        setIsAdmin(firebaseUser.email === adminEmail);

        // Sync credits from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // Initialize new user with 60 credits
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              credits: 60,
              role: firebaseUser.email === adminEmail ? 'admin' : 'user',
              createdAt: new Date().toISOString()
            });
            setCredits(60);
          } else {
            setCredits(userDoc.data().credits || 0);
          }

          // Listen for real-time credit updates
          unsubscribeCredits = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setCredits(doc.data().credits || 0);
            }
          }, (error) => {
            console.error("Credits snapshot error:", error);
            // Handle permission denied gracefully
            if (error.code === 'permission-denied') {
              console.warn("Permission denied for credits listener. This is expected on logout.");
            } else {
              handleFirestoreError(error, OperationType.GET, 'users');
            }
          });
        } catch (err) {
          console.error("Error fetching user data:", err);
          if (err instanceof Error && !err.message.includes('Firestore Error')) {
            // If it's not already a handled firestore error, wrap it
            try {
              handleFirestoreError(err, OperationType.GET, 'users');
            } catch (e) {
              // Re-throw the wrapped error
              throw e;
            }
          }
          throw err;
        }
      } else {
        setIsAdmin(false);
        setCredits(0);
      }
    });

    // Clean up stale blob URLs from history on mount
    const savedHistory = localStorage.getItem('vision_ai_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const cleaned = parsed.map((item: any) => {
          if (item.type === 'video' && item.url.startsWith('blob:')) {
            return { ...item, url: '', expired: true };
          }
          return item;
        });
        setHistory(cleaned);
      } catch (e) {
        console.error("Failed to parse history:", e);
      }
    }

    return () => {
      unsubscribeAuth();
      if (unsubscribeCredits) unsubscribeCredits();
    };
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [manualApiKey]);

  useEffect(() => {
    const saveHistory = () => {
      try {
        localStorage.setItem('vision_ai_history', JSON.stringify(history));
      } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          console.warn("LocalStorage quota exceeded, truncating history...");
          // If quota exceeded, try saving only the most recent 10 items
          if (history.length > 10) {
            const truncated = history.slice(0, 10);
            try {
              localStorage.setItem('vision_ai_history', JSON.stringify(truncated));
            } catch (innerE) {
              console.error("Failed to save even truncated history:", innerE);
              // Last resort: clear history from storage if it's still too big
              localStorage.removeItem('vision_ai_history');
            }
          } else if (history.length > 0) {
            // If even 10 items are too much (e.g. very large images), try saving one by one or just clear
            localStorage.removeItem('vision_ai_history');
          }
        } else {
          console.error("Failed to save history:", e);
        }
      }
    };

    saveHistory();
  }, [history]);

  const checkApiKey = async () => {
    try {
      if (manualApiKey || localStorage.getItem('veo_manual_api_key')) {
        setApiKeySelected(true);
        return;
      }
      
      const envKey = (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        // Automatic for new users: if envKey exists, consider it selected
        setApiKeySelected(hasKey || !!envKey);
      } else {
        setApiKeySelected(!!envKey);
      }
    } catch (err) {
      console.error("Error checking API key:", err);
      setApiKeySelected(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
      setShowSettings(false);
    } catch (err) {
      console.error("Error opening key selector:", err);
    }
  };

  const handleSaveManualKey = () => {
    localStorage.setItem('veo_manual_api_key', manualApiKey);
    setShowSettings(false);
    setApiKeySelected(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePromptIdea = async () => {
    setIsSuggesting(true);
    try {
      const currentApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      if (window.aistudio && !currentApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      const ai = new GoogleGenAI({ apiKey: currentApiKey || '' });
      
      const suggestionPrompt = `Generate a creative, highly detailed video prompt for Google Veo 3.1. 
      The style is ${animationStyle}, the camera movement is ${cameraStyle}, and the scene is ${sceneType}.
      Return ONLY the prompt text, no extra commentary. Keep it under 50 words but very descriptive.`;
      
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: suggestionPrompt
      });

      if (result.text) {
        setPrompt(result.text.trim());
      }
    } catch (err) {
      console.error("Suggestion error:", err);
      setError("Failed to generate prompt idea. Check your API key.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const currentApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: currentApiKey || '' });
      
      const enhancementPrompt = `Enhance this visual prompt for an AI video generator. 
      Make it more descriptive, cinematic, and detailed. 
      The style is ${animationStyle}, the camera movement is ${cameraStyle}, and the scene is ${sceneType}.
      Keep it under 100 words. Return ONLY the enhanced prompt.
      Original Prompt: "${prompt}"`;
      
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: enhancementPrompt
      });

      if (result.text) {
        setPrompt(result.text.trim());
      }
    } catch (err) {
      console.error("Enhancement error:", err);
      setError("Failed to enhance prompt. Check your API key.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyStylePreset = (presetPrompt: string) => {
    if (prompt.includes(presetPrompt)) return;
    setPrompt(prev => prev ? `${prev}, ${presetPrompt}` : presetPrompt);
  };

  const generateMetadata = async (contentPrompt: string) => {
    setIsGeneratingMetadata(true);
    try {
      const currentApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      if (!currentApiKey || currentApiKey === 'MY_GEMINI_API_KEY') return;
      const ai = new GoogleGenAI({ apiKey: currentApiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this prompt: "${contentPrompt}", generate a catchy YouTube/Social Media title, a short engaging description, and 5 relevant hashtags. Return the result in JSON format with keys: "title", "description", "hashtags" (as a string).`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const result = JSON.parse(response.text || '{}');
      setGeneratedTitle(result.title || '');
      setGeneratedDescription(result.description || '');
      setGeneratedHashtags(result.hashtags || '');
    } catch (err) {
      console.error("Metadata generation error:", err);
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const generateThumbnail = async () => {
    if (credits < 5) {
      setError("Insufficient credits. You need 5 credits to generate a thumbnail.");
      return;
    }

    setIsGeneratingThumbnail(true);
    setStatus('Generating cinematic thumbnail...');
    try {
      const currentApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      if (window.aistudio && !currentApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      const ai = new GoogleGenAI({ apiKey: currentApiKey || '' });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `High-quality cinematic YouTube thumbnail for: ${prompt}. Style: ${animationStyle}. Vibrant colors, eye-catching composition, no text.` }] },
        config: {
          imageConfig: {
            aspectRatio: '16:9',
            imageSize: '1K'
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedThumbnailUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (err) {
      console.error("Thumbnail generation error:", err);
      setError("Failed to generate thumbnail.");
    } finally {
      setIsGeneratingThumbnail(false);
      setStatus('');
    }
  };

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev].slice(0, 20));
  };

  const extendVideo = async () => {
    if (!lastVideoOperation || resolution !== '720p') {
      setError("Only 720p videos can be extended.");
      return;
    }

    setIsExtending(true);
    setError(null);
    setStatus('Extending video... Adding 7 seconds of cinematic motion.');

    try {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      const currentApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: currentApiKey || '' });

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: `Continue the scene: ${prompt}`,
        video: lastVideoOperation.response?.generatedVideos?.[0]?.video,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio as any,
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        setStatus('Extending video... Almost done.');
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          headers: { 'x-goog-api-key': currentApiKey || '' },
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGeneratedVideoUrl(url);
        setLastVideoOperation(operation);
        addToHistory({
          type: 'video',
          url,
          prompt: `Extended: ${prompt}`,
          operation
        });
        setStatus('Extension complete!');
      }
    } catch (err: any) {
      setError(err.message || "Failed to extend video.");
    } finally {
      setIsExtending(false);
    }
  };

  const handleVideoGenerate = async () => {
    if (!user) {
      setError("Please login to generate content.");
      setShowSettings(true);
      return;
    }
    const creditCost = mode === 'video' ? 20 : 5;
    
    if (credits < creditCost) {
      setError(`Insufficient credits. You need ${creditCost} credits to generate a ${mode.replace(/-/g, ' ')}.`);
      return;
    }

    if (!prompt.trim() && !image) {
      setError("Please provide a prompt or a reference image.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setGeneratedImageUrl(null);
    setGeneratedThumbnailUrl(null);
    setGeneratedTitle('');
    setGeneratedDescription('');
    setGeneratedHashtags('');
    setStatus('Initializing generation...');

    try {
      // Deduct credits in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        credits: increment(-creditCost)
      });

      // For Veo models, we MUST ensure a paid API key is selected via the platform dialog
      if (window.aistudio && mode === 'video' && !manualApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
          // We return early and let the user click again once they've selected the key
          setIsGenerating(false);
          setStatus('');
          return;
        }
      }

      const currentApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      const ai = new GoogleGenAI({ apiKey: currentApiKey || '' });

      // Step 1: Analyze Reference Image for maximum fidelity if image exists
      let detailedProductDescription = "";
      const referenceForAnalysis = image || (autoAddProduct && products.length > 0 ? products[0].image : null);
      
      if (referenceForAnalysis && productFidelity) {
        setStatus('Analyzing product details for 100% fidelity...');
        try {
          const analysisResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
              parts: [
                { 
                  inlineData: { 
                    data: referenceForAnalysis.split(',')[1], 
                    mimeType: referenceForAnalysis.split(';')[0].split(':')[1] 
                  } 
                },
                { text: "Describe this specific product in extreme, technical detail. Focus on its exact geometry, unique textures, specific colors, branding/logos, and any distinctive design elements. Provide a technical description that ensures an AI model can recreate this EXACT object without any variations. Be concise but highly specific." }
              ]
            }
          });
          detailedProductDescription = analysisResponse.text || "";
        } catch (analysisErr) {
          console.error("Analysis failed, proceeding with standard prompt:", analysisErr);
        }
      }
      
      if (mode === 'video') {
        const config: any = {
          numberOfVideos: 1,
          resolution,
          aspectRatio,
        };

        const characterContext = characterModel !== 'none' ? `Character: Realistic ${characterAge} ${characterModel} model. Pose: ${characterPose}.` : '';
        const productContext = autoAddProduct && products.length > 0 
          ? `Include products: ${products.map(p => p.name).join(', ')}.` 
          : '';
        const fidelityContext = productFidelity 
          ? `STRICT FIDELITY REQUIREMENT: The product in the video MUST be an IDENTICAL PIXEL-PERFECT REPLICA of the object in the reference image. Product Description: ${detailedProductDescription || 'The exact object shown in the reference image'}. Do not apply stylistic distortions to the product itself. Maintain all logos, materials, and proportions exactly.` 
          : "";
        const styleContext = `Style: ${animationStyle}. Camera: ${cameraStyle}. Scene: ${sceneType}. Lighting: ${lightingStyle}. ${characterContext} ${productContext}`;
        const upscaleContext = scaleImage ? "UPSCALE REQUIREMENT: Enhance the output to ultra-high resolution with maximum detail and clarity. Perform super-resolution upscaling while preserving all original features." : "";
        const finalPrompt = `${styleContext} ${prompt} ${fidelityContext} ${upscaleContext} ${enableSound ? '(Include high-quality atmospheric sound effects)' : '(Silent video)'} The product is the absolute central focus and must be visually indistinguishable from the source reference.`;

        let operation;
        
        // Use main image or first product image as reference for Veo
        const videoReferenceImage = image || (autoAddProduct && products.length > 0 ? products[0].image : null);

        if (videoReferenceImage) {
          const base64Data = videoReferenceImage.split(',')[1];
          const mimeType = videoReferenceImage.split(';')[0].split(':')[1];
          
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: finalPrompt,
            image: {
              imageBytes: base64Data,
              mimeType: mimeType,
            },
            config
          });
        } else {
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: finalPrompt,
            config
          });
        }

        setStatus('Processing video... This may take a few minutes.');
        
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({ operation: operation });
          const messages = ['Rendering frames...', 'Applying textures...', 'Synthesizing motion...', 'Finalizing video export...', 'Almost there...'];
          setStatus(messages[Math.floor(Math.random() * messages.length)]);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          const response = await fetch(downloadLink, {
            method: 'GET',
            headers: { 'x-goog-api-key': currentApiKey || '' },
          });
          if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setGeneratedVideoUrl(url);
          setLastVideoOperation(operation);
          addToHistory({
            type: 'video',
            url,
            prompt,
            operation
          });
          setStatus('Generation complete!');
          generateMetadata(prompt);
        }
      } else {
        // Image Generation
        setStatus('Generating high-fidelity image...');
        const characterContext = characterModel !== 'none' ? `Realistic ${characterAge} ${characterModel} model, ${characterPose} pose,` : '';
        const productContext = autoAddProduct && products.length > 0 
          ? `featuring the products (${products.map(p => p.name).join(', ')}) with exact visual likeness to the reference image, preserving all unique design elements and textures perfectly,` 
          : '';
        const fidelityContext = productFidelity 
          ? `PIXEL-PERFECT FIDELITY: The product must be a 1:1 identical match to the reference image. Detailed Product Features to preserve: ${detailedProductDescription || 'All visual details from the reference'}. Zero stylistic deviation allowed for the product object.` 
          : "";
        const upscaleContext = scaleImage ? "UPSCALE REQUIREMENT: Enhance the image to ultra-high resolution with maximum detail and clarity. Perform super-resolution upscaling while preserving all original features." : "";
        const parts: any[] = [{ text: `${animationStyle} style, ${sceneType} scene, ${lightingStyle} lighting, ${characterContext} ${productContext} ${prompt}. ${fidelityContext} ${upscaleContext} The product must be visually indistinguishable from the reference.` }];
        
        // Add main reference image if it exists
        if (image) {
          const base64Data = image.split(',')[1];
          const mimeType = image.split(';')[0].split(':')[1];
          parts.unshift({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }

        // Add product catalog images as visual references even in text-to-image mode
        if (autoAddProduct && products.length > 0) {
          // Add up to 2 products as visual context
          products.slice(0, 2).forEach(p => {
            const base64Data = p.image.split(',')[1];
            const mimeType = p.image.split(';')[0].split(':')[1];
            parts.unshift({
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            });
          });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            setGeneratedImageUrl(url);
            addToHistory({
              type: 'image',
              url,
              prompt
            });
            setStatus('Generation complete!');
            generateMetadata(prompt);
            break;
          }
        }
      }
    } catch (err: any) {
      console.error("Generation error details:", err);
      
      let errorMsg = "";
      let isPermissionError = false;

      // Try to parse the error message if it's a JSON string
      try {
        const parsed = JSON.parse(err.message);
        errorMsg = parsed.error?.message || err.message;
        if (parsed.error?.status === 'PERMISSION_DENIED' || parsed.error?.code === 403) {
          isPermissionError = true;
        }
      } catch {
        errorMsg = err.message || String(err);
        isPermissionError = errorMsg.includes("PERMISSION_DENIED") || 
                            errorMsg.includes("403") || 
                            errorMsg.includes("not have permission");
      }
      
      const isNotFoundError = errorMsg.includes("Requested entity was not found") || 
                             errorMsg.includes("404");

      if (isPermissionError || isNotFoundError) {
        setApiKeySelected(false);
        if (window.aistudio && !manualApiKey) {
          window.aistudio.openSelectKey();
        }
        if (manualApiKey) {
          setError("PERMISSION DENIED: The manual API key provided does not have permission for Veo 3.1. Please ensure billing is enabled on your Google Cloud project and the model is accessible.");
        } else {
          setError("PERMISSION DENIED: The selected API key does not have permission for Veo 3.1. This model requires a key from a PAID Google Cloud project with billing enabled.");
        }
      } else {
        setError(errorMsg || "An error occurred during video generation.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearKeys = () => {
    localStorage.removeItem('veo_manual_api_key');
    setManualApiKey('');
    setApiKeySelected(false);
    setShowSettings(false);
  };

  const addProduct = () => {
    if (newProduct.trim()) {
      setProducts([...products, { name: newProduct.trim(), image: newProductImage || undefined }]);
      setNewProduct('');
      setNewProductImage(null);
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleTopUp = async () => {
    if (!user || !isAdmin) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        credits: increment(50)
      });
    } catch (err) {
      console.error("Top up error:", err);
      setError("Failed to top up credits.");
    }
  };

  const [targetEmail, setTargetEmail] = useState('');
  const [targetAmount, setTargetAmount] = useState(50);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const handleAdminAddCredits = async () => {
    if (!user || !isAdmin || !targetEmail) return;
    setAdminActionLoading(true);
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', targetEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError("User with that email not found.");
        return;
      }

      const targetUserDoc = querySnapshot.docs[0];
      const targetUserRef = doc(db, 'users', targetUserDoc.id);
      
      await updateDoc(targetUserRef, {
        credits: increment(targetAmount)
      });
      
      setTargetEmail('');
      alert(`Successfully added ${targetAmount} credits to ${targetEmail}`);
    } catch (err) {
      console.error("Admin add credits error:", err);
      setError("Failed to add credits to user.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/cancelled-popup-request') {
        console.warn("Login popup request was cancelled by a subsequent request.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        console.log("User closed the login popup.");
      } else {
        console.error("Login error:", err);
        setError("Failed to login with Google. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (apiKeySelected === false && !manualApiKey) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#111] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
        >
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
            <Settings className="w-10 h-10 text-orange-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">API Key Required</h1>
            <p className="text-white/60 text-sm">
              To use Veo 3.1 video generation, you must provide a paid Google Cloud project API key.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleSelectKey}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
            >
              Select Paid Key (Recommended)
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#111] px-2 text-white/40">Or enter manually</span></div>
            </div>

            <div className="space-y-2">
              <input 
                type="password"
                value={manualApiKey}
                onChange={(e) => setManualApiKey(e.target.value)}
                placeholder="Enter API Key manually..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50"
              />
              <button
                onClick={handleSaveManualKey}
                disabled={!manualApiKey}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Use Manual Key
              </button>
            </div>
          </div>

          <p className="text-xs text-white/40">
            Learn more about <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">billing and API keys</a>.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <Header 
        user={user} 
        mode={mode} 
        setMode={(m) => {
          setMode(m);
          if (m !== 'history') {
            setGeneratedVideoUrl(null);
            setGeneratedImageUrl(null);
            setError(null);
          }
        }} 
        loginWithGoogle={handleLogin} 
        isLoggingIn={isLoggingIn}
        logout={logout}
        isAdmin={isAdmin}
        onReset={() => {
          setMode('video');
          setPrompt('');
          setGeneratedVideoUrl(null);
          setGeneratedImageUrl(null);
          setError(null);
        }}
        viewMode={viewMode}
        setViewMode={setViewMode}
        credits={credits}
        onOpenSettings={() => setShowSettings(true)}
      />

      <SettingsModal 
        show={showSettings}
        onClose={() => setShowSettings(false)}
        credits={credits}
        isAdmin={isAdmin}
        user={user}
        handleTopUp={handleTopUp}
        handleSelectKey={handleSelectKey}
        manualApiKey={manualApiKey}
        setManualApiKey={setManualApiKey}
        handleSaveManualKey={handleSaveManualKey}
        handleClearKeys={handleClearKeys}
        targetEmail={targetEmail}
        setTargetEmail={setTargetEmail}
        targetAmount={targetAmount}
        setTargetAmount={setTargetAmount}
        handleAdminAddCredits={handleAdminAddCredits}
        adminActionLoading={adminActionLoading}
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative z-20">
        <AnimatePresence mode="wait">
          {mode === 'admin' && isAdmin ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdminDashboard />
            </motion.div>
          ) : mode === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HistoryView 
                history={history} 
                onDelete={(id) => setHistory(prev => prev.filter(h => h.id !== id))} 
                onReopen={(item) => {
                  setMode('video');
                  setGeneratedVideoUrl(item.url);
                  setLastVideoOperation(item.operation);
                  setPrompt(item.prompt);
                }} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`grid gap-8 ${
                viewMode === 'desktop' ? 'grid-cols-12' : 
                viewMode === 'portrait' ? 'grid-cols-1' : 
                'grid-cols-1 lg:grid-cols-12'
              }`}
            >
              {/* Login Banner */}
              {!user && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${
                  viewMode === 'desktop' ? 'col-span-12' : 
                  viewMode === 'portrait' ? 'col-span-1' : 
                  'lg:col-span-12'
                } p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                    <UserCircle2 className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Unlock Full Potential</h3>
                    <p className="text-sm text-white/40">Login to start generating, sync your history, and manage credits.</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="relative z-10 px-8 py-3 bg-orange-500 text-black font-black text-xs rounded-2xl hover:bg-orange-600 transition-all active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? 'LOGGING IN...' : 'LOGIN WITH GOOGLE'}
                </button>
              </motion.div>
            )}
            {/* Controls Column */}
            <div className={`${
              viewMode === 'desktop' ? 'col-span-5' : 
              viewMode === 'portrait' ? 'col-span-1' : 
              'lg:col-span-5'
            } space-y-8 relative z-30`}>
          <PromptConfiguration 
            prompt={prompt}
            setPrompt={setPrompt}
            isEnhancing={isEnhancing}
            isSuggesting={isSuggesting}
            isGenerating={isGenerating}
            enhancePrompt={enhancePrompt}
            generatePromptIdea={generatePromptIdea}
            applyStylePreset={applyStylePreset}
          />

          <Controls 
            characterModel={characterModel}
            setCharacterModel={setCharacterModel}
            characterAge={characterAge}
            setCharacterAge={setCharacterAge}
            characterPose={characterPose}
            setCharacterPose={setCharacterPose}
            products={products}
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            newProductImage={newProductImage}
            productFileInputRef={productFileInputRef}
            handleProductImageUpload={handleProductImageUpload}
            addProduct={addProduct}
            removeProduct={removeProduct}
            autoAddProduct={autoAddProduct}
            setAutoAddProduct={setAutoAddProduct}
            image={image}
            setImage={setImage}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            animationStyle={animationStyle}
            setAnimationStyle={setAnimationStyle}
            cameraStyle={cameraStyle}
            setCameraStyle={setCameraStyle}
            sceneType={sceneType}
            setSceneType={setSceneType}
            lightingStyle={lightingStyle}
            setLightingStyle={setLightingStyle}
            resolution={resolution}
            setResolution={setResolution}
            mode={mode}
          />

          {mode === 'video' && (
            <div className="space-y-4">
              <section className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-bold">Product Fidelity</p>
                    <p className="text-[10px] text-white/40">Ensure exact likeness to reference</p>
                  </div>
                </div>
                <button 
                  onClick={() => setProductFidelity(!productFidelity)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${productFidelity ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/10'}`}
                >
                  <motion.div 
                    animate={{ x: productFidelity ? 26 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                  />
                </button>
              </section>

              <section className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  {enableSound ? <Volume2 className="w-5 h-5 text-orange-500" /> : <VolumeX className="w-5 h-5 text-white/20" />}
                  <div>
                    <p className="text-sm font-bold">Enable Sound</p>
                    <p className="text-[10px] text-white/40">Atmospheric audio synthesis</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEnableSound(!enableSound)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${enableSound ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/10'}`}
                >
                  <motion.div 
                    animate={{ x: enableSound ? 26 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                  />
                </button>
              </section>
            </div>
          )}

          <section className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <Maximize2 className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-bold">Scale Image (Upscale)</p>
                <p className="text-[10px] text-white/40">Enhance resolution and detail</p>
              </div>
            </div>
            <button 
              onClick={() => setScaleImage(!scaleImage)}
              className={`w-12 h-6 rounded-full transition-colors relative ${scaleImage ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: scaleImage ? 26 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
              />
            </button>
          </section>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleVideoGenerate();
            }}
            disabled={isGenerating}
            className={`w-full py-5 rounded-2xl font-black text-lg tracking-tight transition-all flex items-center justify-center gap-3 relative group overflow-hidden cursor-pointer z-40 touch-manipulation ${
              isGenerating
                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                : !user
                  ? 'bg-white/10 text-white/40 hover:bg-white/20 border border-white/10'
                  : 'bg-orange-500 hover:bg-orange-400 text-black shadow-2xl shadow-orange-500/40 active:scale-[0.98]'
            }`}
          >
            {!isGenerating && user && (
              <motion.div 
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
              />
            )}
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="animate-pulse">GENERATING...</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" />
                {user ? `GENERATE ${mode.replace(/-/g, ' ').toUpperCase()}` : 'LOGIN TO GENERATE'}
              </>
            )}
          </button>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-500"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Output Column */}
        <div className={`${
          viewMode === 'desktop' ? 'col-span-7' : 
          viewMode === 'portrait' ? 'col-span-1' : 
          'lg:col-span-7'
        }`}>
          <div className={`${viewMode === 'desktop' || (viewMode === 'auto' && window.innerWidth >= 1024) ? 'sticky top-28' : ''} space-y-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Maximize2 className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Output Preview</h2>
              </div>
              {(generatedVideoUrl || generatedImageUrl) && (
                <a 
                  href={generatedVideoUrl || generatedImageUrl || ''} 
                  download={mode === 'video' ? "vision-ai-video.mp4" : "vision-ai-image.png"}
                  className="flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD
                </a>
              )}
            </div>

            <div className={`relative rounded-[32px] overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl group ${
              aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[400px] mx-auto' :
              aspectRatio === '16:9' ? 'aspect-video w-full' :
              aspectRatio === '4:3' ? 'aspect-[4/3] w-full' :
              aspectRatio === '3:4' ? 'aspect-[3/4] max-w-[450px] mx-auto' :
              'aspect-square w-full'
            }`}>
              {/* Preview Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="relative">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="w-24 h-24 rounded-full border-t-2 border-r-2 border-orange-500/50"
                        />
                        <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-2 rounded-full border-b-2 border-l-2 border-blue-500/50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-orange-500">Processing</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Synthesizing Neural Visuals</p>
                      </div>
                    </motion.div>
                  ) : generatedVideoUrl ? (
                    <motion.div 
                      key="video"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full relative"
                    >
                      <video 
                        src={generatedVideoUrl || null} 
                        controls 
                        autoPlay 
                        loop 
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : generatedImageUrl ? (
                    <motion.div 
                      key="image"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-full relative"
                    >
                      <img 
                        src={generatedImageUrl || null} 
                        alt="Generated" 
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-6 text-white/5"
                    >
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/10 to-blue-500/10 blur-xl" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 opacity-20" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm font-black uppercase tracking-[0.3em] opacity-20">Awaiting Generation</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-10">Neural Engine Ready</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Glass Overlay for Controls */}
              <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[32px] shadow-inner" />
            </div>

            <AnimatePresence>
              {(generatedVideoUrl || generatedImageUrl) && (
                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-green-500/5 backdrop-blur-md border border-green-500/20 rounded-[32px] flex items-center gap-4 shadow-xl"
                  >
                    <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-500">Generation Successful</h3>
                      <p className="text-xs text-white/60">Your {mode.replace(/-/g, ' ')} is ready for playback and download.</p>
                    </div>
                  </motion.div>

                  <div className="flex flex-wrap gap-3">
                    {mode === 'video' && resolution === '720p' && (
                      <button 
                        onClick={extendVideo}
                        disabled={isExtending}
                        className="flex-1 py-4 glass-button text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isExtending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {isExtending ? 'Extending...' : 'Extend +7s'}
                      </button>
                    )}
                    <a 
                      href={generatedVideoUrl || generatedImageUrl || ''} 
                      download={mode === 'video' ? "vision-ai-video.mp4" : "vision-ai-image.png"}
                      className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98]"
                    >
                      <Download className="w-4 h-4" />
                      Download {mode === 'video' ? 'MP4' : 'PNG'}
                    </a>
                  </div>

                  {/* Metadata Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-3xl"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-orange-500">Content Metadata</h3>
                      {isGeneratingMetadata && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Suggested Title</p>
                        <p className="text-sm font-bold">{generatedTitle || 'Generating...'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Description</p>
                        <p className="text-xs text-white/60 leading-relaxed">{generatedDescription || 'Generating...'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Hashtags</p>
                        <p className="text-xs text-orange-500/80 font-mono">{generatedHashtags || 'Generating...'}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Thumbnail Section (Only for Video) */}
                  {mode === 'video' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-3xl"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-orange-500">Video Thumbnail</h3>
                        {!generatedThumbnailUrl && (
                          <button 
                            onClick={generateThumbnail}
                            disabled={isGeneratingThumbnail}
                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg border border-orange-500/20 transition-all text-[10px] font-bold uppercase tracking-wider"
                          >
                            {isGeneratingThumbnail ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                            Generate Thumbnail (5 Credits)
                          </button>
                        )}
                      </div>

                      {generatedThumbnailUrl ? (
                        <div className="space-y-4">
                          <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                            <img src={generatedThumbnailUrl || null} alt="Thumbnail" className="w-full h-full object-cover" />
                          </div>
                          <a 
                            href={generatedThumbnailUrl} 
                            download="vision-ai-thumbnail.png"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-xs font-bold uppercase tracking-widest"
                          >
                            <Download className="w-4 h-4" />
                            Download Thumbnail
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-white/40 italic">Generate a high-quality cinematic thumbnail for your video.</p>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto p-12 border-t border-white/5 text-center space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Powered by Google Veo 3.1 & Gemini 3.1 Technology</p>
        <div className="flex items-center justify-center gap-6">
          <div className="w-1 h-1 bg-white/10 rounded-full" />
          <div className="w-1 h-1 bg-white/10 rounded-full" />
          <div className="w-1 h-1 bg-white/10 rounded-full" />
        </div>
      </footer>
    </div>
  );
}
