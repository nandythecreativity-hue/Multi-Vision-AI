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
  orderBy,
  addDoc,
  deleteDoc,
  FirebaseUser,
  handleFirestoreError,
  OperationType,
  serverTimestamp
} from './firebase';

import { AppMode, AspectRatio, HistoryItem, Product } from './types';
import { 
  ANIMATION_STYLES, 
  CAMERA_STYLES, 
  SCENE_TYPES, 
  LIGHTING_STYLES, 
  CHARACTER_POSES, 
  CHARACTER_AGES, 
  STYLE_PRESETS,
  CAMERA_STYLE_DESCRIPTIONS
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
import { Sidebar } from './components/Sidebar';
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
  const [images, setImages] = useState<string[]>([]);
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [numOutputs, setNumOutputs] = useState<number>(1);
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string>('');
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [generatedHashtags, setGeneratedHashtags] = useState<string>('');
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageCredits, setImageCredits] = useState<number>(0);
  const [videoCredits, setVideoCredits] = useState<number>(0);
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
        // Test Firestore write
        try {
          const testDocRef = doc(db, 'test', 'ping-' + firebaseUser.uid);
          await setDoc(testDocRef, { 
            timestamp: serverTimestamp(), 
            message: 'ping',
            uid: firebaseUser.uid 
          });
          console.log('Firestore test write successful for user:', firebaseUser.uid);
        } catch (testErr) {
          console.error('Firestore test write failed:', testErr);
        }

        // Check if admin
        const adminEmail = "nandythecreativity@gmail.com";
        const isUserAdmin = firebaseUser.email === adminEmail;
        setIsAdmin(isUserAdmin);
        console.log('User logged in:', firebaseUser.email, 'isAdmin:', isUserAdmin);

        // Sync credits from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // Initialize new user with 50 image credits and 20 video credits
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              imageCredits: 50,
              videoCredits: 20,
              role: firebaseUser.email === adminEmail ? 'admin' : 'user',
              status: 'online',
              lastActive: Date.now(),
              imageCount: 0,
              videoCount: 0,
              createdAt: new Date().toISOString()
            });
            setImageCredits(50);
            setVideoCredits(20);
          } else {
            // Update status to online
            await updateDoc(userDocRef, {
              status: 'online',
              lastActive: Date.now()
            });
            const data = userDoc.data();
            setImageCredits(data.imageCredits || 0);
            setVideoCredits(data.videoCredits || 0);
          }

          // Listen for real-time credit updates
          unsubscribeCredits = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setImageCredits(data.imageCredits || 0);
              setVideoCredits(data.videoCredits || 0);
              setIsAdmin(data.role === 'admin' || firebaseUser.email === adminEmail);
            }
          }, (error) => {
            console.error("Credits snapshot error:", error);
            // Handle permission denied gracefully
            if (error.code === 'permission-denied') {
              console.warn("Permission denied for credits listener. This is expected on logout.");
            } else if (error.message.includes('offline') || error.message.includes('Failed to get document')) {
              console.error("Firestore is offline. Please check your Firebase Console.");
            } else {
              handleFirestoreError(error, OperationType.GET, userDocRef.path);
            }
          });
        } catch (err) {
          console.error("Error fetching user data:", err);
          if (err instanceof Error && !err.message.includes('Firestore Error')) {
            // If it's not already a handled firestore error, wrap it
            try {
              handleFirestoreError(err, OperationType.GET, userDocRef.path);
            } catch (e) {
              // Re-throw the wrapped error
              throw e;
            }
          }
          throw err;
        }
      } else {
        setIsAdmin(false);
        setImageCredits(0);
        setVideoCredits(0);
      }
    });

    // Clean up stale blob URLs from history on mount
    // (Deprecated: History is now in Firestore)

    return () => {
      unsubscribeAuth();
      if (unsubscribeCredits) unsubscribeCredits();
    };
  }, []);

  // Track online/offline status
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateDoc(userDocRef, { status: 'online', lastActive: Date.now() });
      } else {
        updateDoc(userDocRef, { status: 'offline', lastActive: Date.now() });
      }
    };

    const handleBeforeUnload = () => {
      updateDoc(userDocRef, { status: 'offline', lastActive: Date.now() });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateDoc(userDocRef, { status: 'offline', lastActive: Date.now() });
    };
  }, [user]);

  useEffect(() => {
    checkApiKey();
  }, [manualApiKey]);

  useEffect(() => {
    // History is now handled by Firestore
  }, [history]);

  const checkApiKey = async () => {
    try {
      // 1. Check manual key (BYOK)
      const savedKey = localStorage.getItem('veo_manual_api_key');
      if (manualApiKey || savedKey) {
        setApiKeySelected(true);
        return;
      }
      
      // 2. Check AI Studio platform key (BYOK)
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
          setApiKeySelected(true);
          return;
        }
      }

      // 3. Check environment key (System Default)
      const envKey = (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      setApiKeySelected(!!envKey);
    } catch (err) {
      console.error("Error checking API key:", err);
      // Fallback to true if we have an environment key, even if the check fails
      const envKey = (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      setApiKeySelected(!!envKey);
    }
  };

  const handleSelectKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success and proceed to app as per guidelines
        setApiKeySelected(true);
        setShowSettings(false);
      }
    } catch (err) {
      console.error("Error opening key selector:", err);
    }
  };

  const handleSaveManualKey = () => {
    const sanitizedKey = (manualApiKey || '').replace(/[^\x00-\x7F]/g, "").trim();
    setManualApiKey(sanitizedKey);
    localStorage.setItem('veo_manual_api_key', sanitizedKey);
    setShowSettings(false);
    setApiKeySelected(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && images.length < 5) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addImage = (url: string) => {
    if (images.length < 5) {
      setImages(prev => [...prev, url]);
    }
  };

  const generatePromptIdea = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    setIsSuggesting(true);
    try {
      const rawApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      // Only force key selection if NO key is available at all
      if (!rawApiKey && window.aistudio) {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
      }

      const currentApiKey = (rawApiKey || (process.env as any).API_KEY || '').replace(/[^\x00-\x7F]/g, "").trim();
      const ai = new GoogleGenAI({ apiKey: currentApiKey || '' });
      
      const cameraContext = CAMERA_STYLE_DESCRIPTIONS[cameraStyle] || `Camera movement: ${cameraStyle}.`;
      const suggestionPrompt = `Generate a creative, highly detailed video prompt for Google Veo 3.1. 
      The style is ${animationStyle}, the ${cameraContext}, and the scene is ${sceneType}.
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
    if (!user) {
      handleLogin();
      return;
    }
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const rawApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      // Only force key selection if NO key is available at all
      if (!rawApiKey && window.aistudio) {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
      }

      const currentApiKey = (rawApiKey || (process.env as any).API_KEY || '').replace(/[^\x00-\x7F]/g, "").trim();
      const ai = new GoogleGenAI({ apiKey: currentApiKey || '' });
      
      const cameraContext = CAMERA_STYLE_DESCRIPTIONS[cameraStyle] || `Camera movement: ${cameraStyle}.`;
      const isImage = mode === 'text-to-image' || mode === 'image-to-image';
      const enhancementPrompt = `Enhance this visual prompt for an AI ${isImage ? 'image' : 'video'} generator. 
      Make it more descriptive, cinematic, and detailed while ensuring MAXIMAL ACCURACY to the original intent. 
      The style is ${animationStyle}, the ${cameraContext}, and the scene is ${sceneType}.
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
      const rawApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      // Only force key selection if NO key is available at all
      if (!rawApiKey && window.aistudio) {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
      }

      const currentApiKey = (rawApiKey || (process.env as any).API_KEY || '').replace(/[^\x00-\x7F]/g, "").trim();
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
    if (!user) {
      handleLogin();
      return;
    }

    if (imageCredits < 2) {
      setError("Insufficient image credits. You need 2 image credits to generate a thumbnail.");
      return;
    }

    setIsGeneratingThumbnail(true);
    setStatus('Generating cinematic thumbnail...');
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        imageCredits: increment(-2)
      });

      const rawApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      // Only force key selection if NO key is available at all
      if (!rawApiKey && window.aistudio) {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
      }

      const currentApiKey = (rawApiKey || (process.env as any).API_KEY || '').replace(/[^\x00-\x7F]/g, "").trim();
      const ai = new GoogleGenAI({ apiKey: currentApiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: `High-quality cinematic YouTube thumbnail for: ${prompt}. Style: ${animationStyle}. Vibrant colors, eye-catching composition, no text. STRICT PROMPT ADHERENCE: Follow the prompt details exactly.` }] },
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

  useEffect(() => {
    let unsubscribeHistory: () => void;

    if (user) {
      const historyQuery = query(
        collection(db, 'history'),
        where('uid', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore Timestamp to number if necessary
          let timestamp = data.timestamp;
          if (timestamp && typeof timestamp === 'object' && 'toMillis' in timestamp) {
            timestamp = timestamp.toMillis();
          } else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
            timestamp = timestamp.seconds * 1000;
          }
          
          return {
            ...data,
            timestamp: timestamp || Date.now(),
            id: doc.id
          };
        }) as HistoryItem[];
        setHistory(items);
      }, (error) => {
        console.error("History snapshot error:", error);
        handleFirestoreError(error, OperationType.GET, 'history');
      });
    } else {
      setHistory([]);
    }

    return () => {
      if (unsubscribeHistory) unsubscribeHistory();
    };
  }, [user]);

  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Use JPEG with 0.7 quality for compression
      };
      img.onerror = () => resolve(base64Str); // Fallback to original if error
    });
  };

  const addToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    let processedItem = { ...item };
    
    // If it's an image and the URL is a base64 string, check size
    if (item.type === 'image' && item.url.startsWith('data:image')) {
      // Approximate size check (1MB limit for Firestore doc)
      // If > 800KB (to be safe with other fields), compress it
      if (item.url.length > 800000) {
        try {
          const compressedUrl = await compressImage(item.url);
          processedItem.url = compressedUrl;
        } catch (err) {
          console.error("Compression error:", err);
        }
      }
    }

    if (user) {
      const newItem = {
        ...processedItem,
        timestamp: serverTimestamp(),
        uid: user.uid
      };
      try {
        await addDoc(collection(db, 'history'), newItem);
      } catch (err) {
        console.error("Error adding to history:", err);
        handleFirestoreError(err, OperationType.CREATE, 'history');
      }
    } else {
      // Fallback for anonymous users (not recommended for production)
      const newItem = {
        ...processedItem,
        timestamp: Date.now(),
        uid: 'anonymous'
      };
      const localItem = { ...newItem, id: Math.random().toString(36).substring(2, 11) };
      setHistory(prev => [localItem as unknown as HistoryItem, ...prev].slice(0, 20));
    }
  };

  const deleteFromHistory = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'history', id));
      } catch (err) {
        console.error("Error deleting from history:", err);
        handleFirestoreError(err, OperationType.DELETE, 'history');
      }
    } else {
      setHistory(prev => prev.filter(h => h.id !== id));
    }
  };

  const extendVideo = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    if (!lastVideoOperation || resolution !== '720p') {
      setError("Only 720p videos can be extended.");
      return;
    }

    setIsExtending(true);
    setError(null);
    setStatus('Extending video... Adding 7 seconds of cinematic motion.');

    try {
      const rawApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      // Only force key selection if NO key is available at all
      if (!rawApiKey && window.aistudio) {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
      }

      const currentApiKey = (rawApiKey || (process.env as any).API_KEY || '').replace(/[^\x00-\x7F]/g, "").trim();
      const ai = new GoogleGenAI({ apiKey: currentApiKey });

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
      handleLogin();
      return;
    }
    const isVideo = mode === 'video';
    const creditCost = isVideo ? 20 : 4;
    const currentCredits = isVideo ? videoCredits : imageCredits;
    
    // Image generation (non-video) fallback to system key if BYOK missing
    const rawApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      setError("API Key Required. Please enter your Gemini API key in Settings or connect via AI Studio.");
      setShowSettings(true);
      return;
    }
    
    if (currentCredits < creditCost) {
      setError(`Insufficient ${isVideo ? 'video' : 'image'} credits. You need ${creditCost} credits to generate a ${isVideo ? 'video' : 'image'}.`);
      return;
    }

    if (!prompt.trim() && images.length === 0) {
      setError("Please provide a prompt or at least one reference image.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setGeneratedImageUrls([]);
    setGeneratedThumbnailUrl(null);
    setGeneratedTitle('');
    setGeneratedDescription('');
    setGeneratedHashtags('');
    setStatus('Initializing generation...');

    try {
      // Deduct credits and increment counters in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const updates: any = {
        lastActive: Date.now(),
        status: 'online'
      };
      
      if (isVideo) {
        updates.videoCredits = increment(-creditCost);
        updates.videoCount = increment(1);
      } else {
        updates.imageCredits = increment(-creditCost);
        updates.imageCount = increment(numOutputs);
      }
      
      await updateDoc(userDocRef, updates);

      // For Veo models, we try to use BYOK but fallback to system key
      if (window.aistudio && mode === 'video' && !manualApiKey && !(process.env as any).API_KEY && !process.env.GEMINI_API_KEY) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
          // Assume success and proceed as per guidelines
          setApiKeySelected(true);
        }
      }

      const finalRawApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      const currentApiKey = (finalRawApiKey || '').replace(/[^\x00-\x7F]/g, "").trim();
      
      const ai = new GoogleGenAI({ apiKey: currentApiKey });

      // Step 1: Analyze Reference Image for maximum fidelity if images exist
      let detailedProductDescription = "";
      const referenceForAnalysis = images[0] || (autoAddProduct && products.length > 0 ? products[0].image : null);
      
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
        const cameraContext = CAMERA_STYLE_DESCRIPTIONS[cameraStyle] || `Camera: ${cameraStyle}.`;
        const styleContext = `Style: ${animationStyle}. ${cameraContext} Scene: ${sceneType}. Lighting: ${lightingStyle}. ${characterContext} ${productContext}`;
        const upscaleContext = scaleImage ? "UPSCALE REQUIREMENT: Enhance the output to ultra-high resolution with maximum detail and clarity. Perform super-resolution upscaling while preserving all original features." : "";
        const finalPrompt = `STRICT FIDELITY & CINEMATIC REQUIREMENT:
        Generate a high-end cinematic video with fluid motion, realistic physics, and professional lighting.
        Follow these specifications with 100% accuracy:
        - STYLE: ${animationStyle}
        - CAMERA: ${cameraContext}
        - SCENE: ${sceneType}
        - LIGHTING: ${lightingStyle}
        - CHARACTER: ${characterContext}
        - PRODUCT CONTEXT: ${productContext}
        - MAIN PROMPT: ${prompt}
        - FIDELITY: ${fidelityContext}
        - ENHANCEMENT: ${upscaleContext}
        - AUDIO: ${enableSound ? 'Include high-quality atmospheric sound effects' : 'Silent video'}
        
        Ensure the product is the absolute central focus and is visually indistinguishable from the source reference. 
        Maintain perfect temporal consistency and photorealistic rendering throughout the entire video duration.`;

        let operation;
        
        // Use images for Veo
        if (images.length > 0) {
          const referenceImagesPayload: any[] = [];
          
          // Veo 3.1 supports up to 3 reference images for specific models
          // We'll use the first one as the starting frame if it's the only one, 
          // or use referenceImages if multiple are provided.
          
          if (images.length === 1) {
            const base64Data = images[0].split(',')[1];
            const mimeType = images[0].split(';')[0].split(':')[1];
            
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
            // Multiple images (up to 3 for Veo)
            for (const img of images.slice(0, 3)) {
              referenceImagesPayload.push({
                image: {
                  imageBytes: img.split(',')[1],
                  mimeType: img.split(';')[0].split(':')[1],
                },
                referenceType: 'ASSET',
              });
            }
            
            operation = await ai.models.generateVideos({
              model: 'veo-3.1-generate-preview',
              prompt: finalPrompt,
              config: {
                ...config,
                referenceImages: referenceImagesPayload,
                resolution: '720p', // Required for multiple refs
                aspectRatio: '16:9' // Required for multiple refs
              }
            });
          }
        } else if (autoAddProduct && products.length > 0) {
          const base64Data = products[0].image.split(',')[1];
          const mimeType = products[0].image.split(';')[0].split(':')[1];
          
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
        setStatus(`Generating ${numOutputs > 1 ? numOutputs : 'high-fidelity'} image${numOutputs > 1 ? 's' : ''}...`);
        const characterContext = characterModel !== 'none' ? `Realistic ${characterAge} ${characterModel} model, ${characterPose} pose,` : '';
        const productContext = autoAddProduct && products.length > 0 
          ? `featuring the products (${products.map(p => p.name).join(', ')}) with exact visual likeness to the reference image, preserving all unique design elements and textures perfectly,` 
          : '';
        const fidelityContext = productFidelity 
          ? `PIXEL-PERFECT FIDELITY: The product must be a 1:1 identical match to the reference image. Detailed Product Features to preserve: ${detailedProductDescription || 'All visual details from the reference'}. Zero stylistic deviation allowed for the product object.` 
          : "";
        const upscaleContext = scaleImage ? "UPSCALE REQUIREMENT: Enhance the image to ultra-high resolution with maximum detail and clarity. Perform super-resolution upscaling while preserving all original features." : "";
        const cameraContext = CAMERA_STYLE_DESCRIPTIONS[cameraStyle] || `Camera: ${cameraStyle}.`;
        const parts: any[] = [{ text: `STRICT PROMPT ADHERENCE & HIGH FIDELITY REQUIREMENT: 
        Generate a masterpiece image with extreme detail, photorealistic textures, and perfect composition. 
        Follow these specifications with 100% accuracy:
        - STYLE: ${animationStyle}
        - CAMERA: ${cameraContext}
        - SCENE: ${sceneType}
        - LIGHTING: ${lightingStyle}
        - CHARACTER: ${characterContext}
        - PRODUCT CONTEXT: ${productContext}
        - MAIN PROMPT: ${prompt}
        - FIDELITY: ${fidelityContext}
        - ENHANCEMENT: ${upscaleContext}
        
        Ensure the product is the absolute central focus and is visually indistinguishable from the source reference. 
        Render with high dynamic range, sharp focus, and professional color grading.` }];
        
        // Add reference images if they exist
        if (images.length > 0) {
          images.forEach(img => {
            const base64Data = img.split(',')[1];
            const mimeType = img.split(';')[0].split(':')[1];
            parts.unshift({
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            });
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

        // Parallel generation for multiple outputs
        if (numOutputs > 1) setStatus(`Generating ${numOutputs} images in parallel...`);
        const generationPromises = Array.from({ length: numOutputs }).map(async (_, i) => {
          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-image-preview',
              contents: { parts },
              config: {
                imageConfig: {
                  aspectRatio: aspectRatio as any,
                  imageSize: scaleImage ? '2K' : '1K'
                }
              }
            });

            for (const part of response.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                const url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                // We don't await here to keep it fast, but we should handle history
                addToHistory({
                  type: 'image',
                  url,
                  prompt
                });
                return url;
              }
            }
          } catch (err) {
            console.error(`Error generating image ${i + 1}:`, err);
            return null;
          }
          return null;
        });

        const results = await Promise.all(generationPromises);
        const newGeneratedUrls = results.filter((url): url is string => url !== null);

        if (newGeneratedUrls.length === 0) {
          throw new Error("Failed to generate any images. Please try again.");
        }

        setGeneratedImageUrls(newGeneratedUrls);
        setStatus('Generation complete!');
        generateMetadata(prompt);
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
        imageCredits: increment(100),
        videoCredits: increment(40)
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
        imageCredits: increment(targetAmount),
        videoCredits: increment(Math.floor(targetAmount / 2.5)) // Proportional video credits
      });
      
      setTargetEmail('');
      alert(`Successfully added credits to ${targetEmail}`);
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
    setError(null);
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

  if (!isAuthReady || apiKeySelected === null) {
    return (
      <div className="min-h-screen bg-cyber-bg text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-cyber-cyan/5 blur-[100px] animate-pulse" />
        <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 rounded-full border-t-2 border-r-2 border-cyber-cyan/50 shadow-[0_0_30px_rgba(0,243,255,0.2)]"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 rounded-full border-b-2 border-l-2 border-cyber-magenta/50 shadow-[0_0_30px_rgba(255,0,255,0.2)]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-cyber-cyan animate-pulse drop-shadow-[0_0_12px_rgba(0,243,255,0.8)]" />
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <h2 className="text-xl font-black uppercase tracking-[0.5em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              System Booting
            </h2>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isAuthReady ? 'bg-cyber-cyan shadow-[0_0_8px_rgba(0,243,255,0.8)]' : 'bg-white/20 animate-pulse'}`} />
                <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${isAuthReady ? 'text-cyber-cyan' : 'text-white/40'}`}>
                  {isAuthReady ? 'Neural Auth Verified' : 'Establishing Neural Link...'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${apiKeySelected !== null ? 'bg-cyber-cyan shadow-[0_0_8px_rgba(0,243,255,0.8)]' : 'bg-white/20 animate-pulse'}`} />
                <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${apiKeySelected !== null ? 'text-cyber-cyan' : 'text-white/40'}`}>
                  {apiKeySelected !== null ? 'API Protocol Ready' : 'Syncing API Protocols...'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cyber-bg text-white font-sans selection:bg-cyber-cyan/30 overflow-x-hidden relative">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.05]" 
           style={{ 
             backgroundImage: 'linear-gradient(var(--color-cyber-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--color-cyber-cyan) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }} 
      />
      {/* Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      <Sidebar 
        mode={mode} 
        setMode={(m) => {
          setMode(m);
          if (m !== 'history') {
            setGeneratedVideoUrl(null);
            setGeneratedImageUrls([]);
            setError(null);
          }
        }} 
        isAdmin={isAdmin}
        viewMode={viewMode}
        onReset={() => {
          setMode('video');
          setPrompt('');
          setGeneratedVideoUrl(null);
          setGeneratedImageUrls([]);
          setError(null);
        }}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Background Atmosphere */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyber-cyan/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyber-magenta/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyber-yellow/5 blur-[120px] rounded-full" />
        </div>

        <Header 
          user={user} 
          mode={mode} 
          setMode={(m) => {
            setMode(m);
            if (m !== 'history') {
              setGeneratedVideoUrl(null);
              setGeneratedImageUrls([]);
              setError(null);
            }
          }} 
          loginWithGoogle={handleLogin} 
          isLoggingIn={isLoggingIn}
          logout={logout}
          isAdmin={isAdmin}
          manualApiKey={manualApiKey}
          onReset={() => {
            setMode('video');
            setPrompt('');
            setGeneratedVideoUrl(null);
            setGeneratedImageUrls([]);
            setError(null);
          }}
          viewMode={viewMode}
          setViewMode={setViewMode}
          imageCredits={imageCredits}
          videoCredits={videoCredits}
          onOpenSettings={() => setShowSettings(true)}
        />

      <SettingsModal 
        show={showSettings}
        onClose={() => setShowSettings(false)}
        imageCredits={imageCredits}
        videoCredits={videoCredits}
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
        setMode={setMode}
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative z-20 w-full">
        <div className="absolute inset-0 bg-cyber-cyan/5 blur-[100px] pointer-events-none" />
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
                onDelete={deleteFromHistory} 
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
            images={images}
            removeImage={removeImage}
            addImage={addImage}
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
            numOutputs={numOutputs}
            setNumOutputs={setNumOutputs}
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

          <section className="flex items-center justify-between p-4 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-cyber-cyan/10 mb-4 shadow-[0_0_15px_rgba(0,243,255,0.05)]">
            <div className="flex items-center gap-3">
              <Maximize2 className="w-5 h-5 text-cyber-cyan drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]" />
              <div>
                <p className="text-sm font-bold text-white/90">Scale Image (Upscale)</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Enhance resolution</p>
              </div>
            </div>
            <button 
              onClick={() => setScaleImage(!scaleImage)}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${scaleImage ? 'bg-cyber-cyan shadow-[0_0_15px_rgba(0,243,255,0.6)]' : 'bg-white/10'}`}
            >
              <motion.div 
                animate={{ x: scaleImage ? 26 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"
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
            className={`w-full py-5 rounded-2xl font-black text-lg tracking-tight transition-all flex items-center justify-center gap-3 relative group overflow-hidden cursor-pointer z-40 touch-manipulation glitch-hover ${
              isGenerating
                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                : !user
                  ? 'bg-white/10 text-white/40 hover:bg-white/20 border border-white/10'
                  : 'bg-cyber-cyan hover:bg-cyber-cyan/80 text-black shadow-[0_0_30px_rgba(0,243,255,0.4)] active:scale-[0.98]'
            }`}
          >
            {!isGenerating && user && (
              <motion.div 
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
              />
            )}
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-black" />
                <span className="animate-pulse">SYNTHESIZING...</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" />
                {user ? (
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-xs font-black">GENERATE {mode.replace(/-/g, ' ').toUpperCase()}</span>
                    <span className="text-[8px] font-bold opacity-70 mt-1">
                      {mode === 'video' ? 'COST: 20 VIDEO CREDITS' : 'COST: 4 IMAGE CREDITS'}
                    </span>
                  </div>
                ) : 'LOGIN TO GENERATE'}
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
              {(generatedVideoUrl || generatedImageUrls.length > 0) && (
                <a 
                  href={generatedVideoUrl || generatedImageUrls[0] || ''} 
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
                          className="w-24 h-24 rounded-full border-t-2 border-r-2 border-cyber-cyan/50 shadow-[0_0_20px_rgba(0,243,255,0.2)]"
                        />
                        <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-2 rounded-full border-b-2 border-l-2 border-cyber-magenta/50 shadow-[0_0_20px_rgba(255,0,255,0.2)]"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-cyber-cyan animate-pulse drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-cyber-cyan drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">Processing</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Neural Synthesis Active</p>
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
                  ) : generatedImageUrls.length > 0 ? (
                    <motion.div 
                      key="images"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`w-full h-full grid gap-2 ${
                        generatedImageUrls.length === 1 ? 'grid-cols-1' :
                        generatedImageUrls.length === 2 ? 'grid-cols-2' :
                        'grid-cols-2 grid-rows-2'
                      }`}
                    >
                      {generatedImageUrls.map((url, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative group overflow-hidden rounded-xl border border-white/10"
                        >
                          <img 
                            src={url} 
                            alt={`Generated ${idx + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a 
                              href={url} 
                              download={`vision-ai-image-${idx + 1}.png`}
                              className="p-2 bg-cyber-cyan text-black rounded-full hover:scale-110 transition-transform"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </motion.div>
                      ))}
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
              {(generatedVideoUrl || generatedImageUrls.length > 0) && (
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
                      <p className="text-xs text-white/60">Your {mode.replace(/-/g, ' ')} {generatedImageUrls.length > 1 ? 'outputs are' : 'is'} ready for playback and download.</p>
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
                    {generatedVideoUrl ? (
                      <a 
                        href={generatedVideoUrl} 
                        download="vision-ai-video.mp4"
                        className="flex-1 py-4 bg-cyber-cyan hover:bg-cyber-cyan/80 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-[0.98]"
                      >
                        <Download className="w-4 h-4" />
                        Download MP4
                      </a>
                    ) : (
                      <div className="flex-1 flex gap-2">
                        {generatedImageUrls.map((url, idx) => (
                          <a 
                            key={idx}
                            href={url} 
                            download={`vision-ai-image-${idx + 1}.png`}
                            className="flex-1 py-4 bg-cyber-cyan hover:bg-cyber-cyan/80 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-[0.98]"
                          >
                            <Download className="w-4 h-4" />
                            {generatedImageUrls.length > 1 ? `#${idx + 1}` : 'Download PNG'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4 p-6 bg-white/[0.02] border border-cyber-cyan/10 rounded-3xl shadow-[0_0_15px_rgba(0,243,255,0.05)]"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-cyber-cyan drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">Neural Metadata</h3>
                      {isGeneratingMetadata && <Loader2 className="w-4 h-4 animate-spin text-cyber-cyan" />}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Suggested Title</p>
                        <p className="text-sm font-bold text-white/90">{generatedTitle || 'Generating...'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Description</p>
                        <p className="text-xs text-white/60 leading-relaxed">{generatedDescription || 'Generating...'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Hashtags</p>
                        <p className="text-xs text-cyber-magenta/80 font-mono drop-shadow-[0_0_3px_rgba(255,0,255,0.3)]">{generatedHashtags || 'Generating...'}</p>
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
                            className="flex items-center gap-2 px-3 py-1.5 bg-cyber-magenta/10 hover:bg-cyber-magenta/20 text-cyber-magenta rounded-lg border border-cyber-magenta/20 transition-all text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,255,0.1)]"
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
      <footer className="max-w-7xl mx-auto p-12 border-t border-white/5 text-center space-y-4 w-full">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Powered by Google Veo 3.1 & Gemini 3.1 Technology</p>
        <div className="flex items-center justify-center gap-6">
          <div className="w-1 h-1 bg-white/10 rounded-full" />
          <div className="w-1 h-1 bg-white/10 rounded-full" />
          <div className="w-1 h-1 bg-white/10 rounded-full" />
        </div>
      </footer>
      </div>
    </div>
  );
}
