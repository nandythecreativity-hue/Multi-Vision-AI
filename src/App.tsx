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
  LogOut
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
  FirebaseUser
} from './firebase';

// Types for AI Studio API Key Selection
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
type Resolution = '720p' | '1080p' | '1K' | '2K';
type AppMode = 'video' | 'text-to-image' | 'image-to-image' | 'history';

type HistoryItem = {
  id: string;
  type: 'video' | 'image';
  url: string;
  thumbnail?: string;
  prompt: string;
  timestamp: number;
  metadata?: {
    title?: string;
    description?: string;
  };
  operation?: any; // For video extension
};

type Product = {
  name: string;
  image?: string;
};

const ANIMATION_STYLES = [
  'Default', 'Realistic', 'Pixar Disney', 'Anime', 'Cyberpunk', 'Cinematic', '3D Render', 'Sketch', 'Oil Painting', 'Digital Art', 'Vibrant',
  'Vogue Editorial', 'National Geographic', 'Synthwave', 'Dark Noir', 'Minimalist', 'Surrealist', 'Street Photography', 'Macro'
];

const CAMERA_STYLES = [
  'Default', 'Static', 'Pan Left', 'Pan Right', 'Zoom In', 'Zoom Out', 'Drone Shot', 'Handheld', 'Low Angle', 'High Angle'
];

const SCENE_TYPES = [
  'Default', 'Urban', 'Nature', 'Space', 'Underwater', 'Fantasy', 'Sci-Fi', 'Interior', 'Exterior'
];

const LIGHTING_STYLES = [
  'Default', 'Natural', 'Studio', 'Neon', 'Golden Hour', 'Moody', 'Bright', 'Cinematic', 'Soft'
];

const CHARACTER_POSES = [
  'Default', 'Standing', 'Walking', 'Sitting', 'Running', 'Dancing', 'Posing', 'Action'
];

const CHARACTER_AGES = [
  'Default', 'Child', 'Teenager', 'Young Adult', 'Adult', 'Middle-aged', 'Elderly'
];

export default function App() {
  const [mode, setMode] = useState<AppMode>('video');
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('720p');
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
  
  const [showSettings, setShowSettings] = useState(false);
  const [manualApiKey, setManualApiKey] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
    const savedKey = localStorage.getItem('veo_manual_api_key');
    if (savedKey) setManualApiKey(savedKey);

    // Firebase Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      
      if (firebaseUser) {
        // Check if admin
        const adminEmail = "nandythecreativity@gmail.com";
        setIsAdmin(firebaseUser.email === adminEmail);

        // Sync credits from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
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
        const unsubscribeCredits = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setCredits(doc.data().credits || 0);
          }
        });

        return () => unsubscribeCredits();
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
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [manualApiKey]);

  useEffect(() => {
    localStorage.setItem('vision_ai_history', JSON.stringify(history));
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

  const generateMetadata = async (contentPrompt: string) => {
    setIsGeneratingMetadata(true);
    try {
      const currentApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      if (!currentApiKey || currentApiKey === 'MY_GEMINI_API_KEY') return;
      const ai = new GoogleGenAI({ apiKey: currentApiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
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
        model: 'gemini-3.1-flash-image-preview',
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
    setHistory(prev => [newItem, ...prev].slice(0, 50));
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

      const currentApiKey = manualApiKey || (process.env as any).API_KEY || process.env.GEMINI_API_KEY;
      
      if (window.aistudio && !currentApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      const ai = new GoogleGenAI({ apiKey: currentApiKey || '' });

      // Step 1: Analyze Reference Image for maximum fidelity if image exists
      let detailedProductDescription = "";
      const referenceForAnalysis = image || (autoAddProduct && products.length > 0 ? products[0].image : null);
      
      if (referenceForAnalysis && productFidelity) {
        setStatus('Analyzing product details for 100% fidelity...');
        try {
          const analysisResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-preview',
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
        const finalPrompt = `${styleContext} ${prompt} ${fidelityContext} ${enableSound ? '(Include high-quality atmospheric sound effects)' : '(Silent video)'} The product is the absolute central focus and must be visually indistinguishable from the source reference.`;

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
        const parts: any[] = [{ text: `${animationStyle} style, ${sceneType} scene, ${lightingStyle} lighting, ${characterContext} ${productContext} ${prompt}. ${fidelityContext} The product must be visually indistinguishable from the reference.` }];
        
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
          model: 'gemini-3.1-flash-image-preview',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: resolution === '1080p' ? '1K' : '512px'
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-bottom border-white/5 p-6 sticky top-0 bg-[#050505]/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Video className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">Vision<span className="text-orange-500">AI</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Multimodal Creative Suite</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
            {(['video', 'text-to-image', 'image-to-image', 'history'] as AppMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  if (m !== 'history') {
                    setGeneratedVideoUrl(null);
                    setGeneratedImageUrl(null);
                    setError(null);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  mode === m ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'
                }`}
              >
                {m.replace(/-/g, ' ')}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Logged In</span>
                  <span className="text-xs font-bold text-white/80">{user.displayName || user.email}</span>
                </div>
                <button 
                  onClick={() => logout()}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-red-500"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-black text-xs rounded-xl transition-all"
              >
                <LogIn className="w-4 h-4" />
                LOGIN
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <Coins className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-black text-orange-500">{credits}</span>
              {isAdmin && (
                <button 
                  onClick={handleTopUp}
                  className="ml-2 px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors text-[10px] font-black text-orange-500 uppercase tracking-wider"
                >
                  Top Up
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-xs font-bold"
            >
              <Settings className="w-4 h-4" />
              API SETTINGS
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
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
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Admin Controls</p>
                    <button
                      onClick={handleTopUp}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      TOP UP +50 CREDITS (ADMIN ONLY)
                    </button>
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
                onClick={() => setShowSettings(false)}
                className="w-full py-2 text-xs text-white/40 hover:text-white transition-colors"
              >
                Close Settings
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <main className="max-w-7xl mx-auto p-6">
        {mode === 'history' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight uppercase">Generation <span className="text-orange-500">History</span></h2>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Your creative journey, archived.</p>
              </div>
              <button 
                onClick={() => setHistory([])}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Clear All
              </button>
            </div>

            {history.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#111] rounded-3xl border border-white/5 border-dashed">
                <History className="w-12 h-12 text-white/10" />
                <p className="text-white/20 font-bold uppercase tracking-widest text-sm">No generations found yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    className="group bg-[#111] border border-white/10 rounded-3xl overflow-hidden hover:border-orange-500/30 transition-all"
                  >
                    <div className="aspect-video relative bg-black flex items-center justify-center">
                      {item.type === 'video' ? (
                        item.url ? (
                          <video 
                            key={item.url}
                            src={item.url} 
                            className="w-full h-full object-cover"
                            onMouseOver={(e) => e.currentTarget.play()}
                            onMouseOut={(e) => e.currentTarget.pause()}
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-white/20 p-4 text-center">
                            <AlertCircle className="w-8 h-8" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Video Expired</p>
                            <p className="text-[8px] opacity-50">Blob URLs are session-only. Download videos to keep them.</p>
                          </div>
                        )
                      ) : (
                        <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button 
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = item.url;
                            a.download = `${item.type}-${item.id}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
                            a.click();
                          }}
                          className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white/60 hover:text-white transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setHistory(prev => prev.filter(h => h.id !== item.id))}
                          className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white/60 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 bg-orange-500 text-black text-[8px] font-black uppercase rounded-md">
                          {item.type}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                        {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-white/80 line-clamp-2 font-medium leading-relaxed">
                        {item.prompt}
                      </p>
                      {item.type === 'video' && item.operation && (
                        <button 
                          onClick={() => {
                            setMode('video');
                            setGeneratedVideoUrl(item.url);
                            setLastVideoOperation(item.operation);
                            setPrompt(item.prompt);
                          }}
                          className="w-full mt-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Login Banner */}
            {!user && (
              <div className="lg:col-span-12 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCircle2 className="w-5 h-5 text-orange-500" />
                  <p className="text-sm font-medium">Login to start generating and sync your credits.</p>
                </div>
                <button 
                  onClick={() => loginWithGoogle()}
                  className="px-4 py-2 bg-orange-500 text-black font-black text-xs rounded-xl"
                >
                  LOGIN NOW
                </button>
              </div>
            )}
            {/* Controls Column */}
            <div className="lg:col-span-5 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Type className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Prompt Configuration</h2>
              </div>
              <button 
                onClick={generatePromptIdea}
                disabled={isSuggesting || isGenerating}
                className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg border border-orange-500/20 transition-all text-[10px] font-bold uppercase tracking-wider"
              >
                {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Magic Suggest
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your video vision... (Supports plain text or JSON format)"
              className="w-full h-32 bg-[#111] border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 transition-colors resize-none placeholder:text-white/20"
            />
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/40">
                <Palette className="w-3 h-3" />
                <h2 className="text-[10px] font-bold uppercase tracking-widest">Style</h2>
              </div>
              <select 
                value={animationStyle}
                onChange={(e) => setAnimationStyle(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
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
                className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
              >
                {CAMERA_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/40">
                <Layout className="w-3 h-3" />
                <h2 className="text-[10px] font-bold uppercase tracking-widest">Scene</h2>
              </div>
              <select 
                value={sceneType}
                onChange={(e) => setSceneType(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
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
                className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
              >
                {LIGHTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </section>

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
                      ? 'bg-orange-500 border-orange-500 text-black' 
                      : 'bg-[#111] border-white/10 text-white/60 hover:border-white/20'
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
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
                  >
                    {CHARACTER_AGES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase text-white/40">Pose / Action</p>
                  <select 
                    value={characterPose}
                    onChange={(e) => setCharacterPose(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
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
                  className={`w-8 h-4 rounded-full transition-colors relative ${autoAddProduct ? 'bg-orange-500' : 'bg-white/10'}`}
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
                    newProductImage ? 'border-orange-500/50' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {newProductImage ? (
                    <img src={newProductImage} alt="New Product" className="w-full h-full object-cover" />
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
                  className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-orange-500/50"
                />
                <button 
                  onClick={addProduct}
                  className="p-2 bg-orange-500 text-black rounded-xl hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {products.map((p, i) => (
                  <div 
                    key={i} 
                    onClick={() => p.image && setImage(p.image)}
                    className={`flex items-center gap-3 p-2 bg-white/5 border rounded-2xl group cursor-pointer transition-all ${
                      image === p.image ? 'border-orange-500 bg-orange-500/5' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black overflow-hidden flex-shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20 font-black">N/A</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white/80 truncate">{p.name}</p>
                      {image === p.image && <p className="text-[8px] text-orange-500 font-black uppercase">Active Ref</p>}
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
              <div className="flex items-center gap-2 text-white/60">
                <ImageIcon className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Reference Image</h2>
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                  image ? 'border-orange-500/50' : 'border-white/10 hover:border-white/20'
                }`}
              >
                {image ? (
                  <div className="relative aspect-video">
                    <img src={image} alt="Reference" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-xs font-bold">Change Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-[#111]">
                    <Upload className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-colors" />
                    <p className="text-xs text-white/40 font-medium">Click to upload reference image</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </section>
          )}

          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Aspect Ratio</h2>
              <div className="flex flex-wrap gap-2">
                {(mode === 'video' ? ['16:9', '9:16'] : ['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      aspectRatio === ratio 
                        ? 'bg-orange-500 border-orange-500 text-black' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Quality</h2>
              <div className="flex gap-2">
                {(mode === 'video' ? ['720p', '1080p'] : ['1K', '2K'] as Resolution[]).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      resolution === res 
                        ? 'bg-orange-500 border-orange-500 text-black' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {mode === 'video' && (
            <div className="space-y-4">
              <section className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-bold">Product Fidelity</p>
                    <p className="text-[10px] text-white/40">Ensure exact likeness to reference</p>
                  </div>
                </div>
                <button 
                  onClick={() => setProductFidelity(!productFidelity)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${productFidelity ? 'bg-orange-500' : 'bg-white/10'}`}
                >
                  <motion.div 
                    animate={{ x: productFidelity ? 26 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                  />
                </button>
              </section>

              <section className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  {enableSound ? <Volume2 className="w-5 h-5 text-orange-500" /> : <VolumeX className="w-5 h-5 text-white/20" />}
                  <div>
                    <p className="text-sm font-bold">Enable Sound</p>
                    <p className="text-[10px] text-white/40">Atmospheric audio synthesis</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEnableSound(!enableSound)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${enableSound ? 'bg-orange-500' : 'bg-white/10'}`}
                >
                  <motion.div 
                    animate={{ x: enableSound ? 26 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                  />
                </button>
              </section>
            </div>
          )}

          <button
            onClick={handleVideoGenerate}
            disabled={isGenerating || !user}
            className={`w-full py-5 rounded-2xl font-black text-lg tracking-tight transition-all flex items-center justify-center gap-3 ${
              isGenerating || !user
                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600 text-black shadow-xl shadow-orange-500/20 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                GENERATING...
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
        <div className="lg:col-span-7">
          <div className="sticky top-28 space-y-6">
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

            <div className={`relative w-full rounded-3xl overflow-hidden border border-white/10 bg-[#111] transition-all ${
              aspectRatio === '16:9' ? 'aspect-video' : 
              aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[400px] mx-auto' :
              aspectRatio === '4:3' ? 'aspect-[4/3]' :
              aspectRatio === '3:4' ? 'aspect-[3/4] max-w-[450px] mx-auto' :
              'aspect-square max-w-[500px] mx-auto'
            }`}>
              {generatedVideoUrl ? (
                <video 
                  key={generatedVideoUrl}
                  src={generatedVideoUrl} 
                  controls 
                  autoPlay 
                  loop 
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("Video error:", e);
                    setError("The generated video could not be loaded. Please try downloading it or generating again.");
                  }}
                />
              ) : generatedImageUrl ? (
                <img 
                  src={generatedImageUrl} 
                  alt="Generated" 
                  className="w-full h-full object-contain"
                />
              ) : isGenerating ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-12 text-center">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {mode === 'video' ? <Video className="w-8 h-8 text-orange-500 animate-pulse" /> : <ImageIcon className="w-8 h-8 text-orange-500 animate-pulse" />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-bold tracking-tight">{status}</p>
                    <p className="text-xs text-white/40 max-w-xs mx-auto">
                      {mode === 'video' ? 'Veo 3.1 is crafting your cinematic experience.' : 'Gemini 3.1 is painting your vision.'} High-quality synthesis takes time.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/10">
                  {mode === 'video' ? <Video className="w-16 h-16" /> : <ImageIcon className="w-16 h-16" />}
                  <p className="text-sm font-bold uppercase tracking-widest">Ready to generate</p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {(generatedVideoUrl || generatedImageUrl) && (
                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-green-500/10 border border-green-500/20 rounded-3xl flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-bold">Generation Successful</h3>
                      <p className="text-xs text-white/60">Your {mode.replace(/-/g, ' ')} is ready for playback and download.</p>
                    </div>
                  </motion.div>

                  <div className="flex flex-wrap gap-3">
                    {mode === 'video' && resolution === '720p' && (
                      <button 
                        onClick={extendVideo}
                        disabled={isExtending}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isExtending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {isExtending ? 'Extending...' : 'Extend +7s'}
                      </button>
                    )}
                    <a 
                      href={generatedVideoUrl || generatedImageUrl || ''} 
                      download={mode === 'video' ? "vision-ai-video.mp4" : "vision-ai-image.png"}
                      className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20"
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
                            <img src={generatedThumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
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
      </div>
    )}
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
