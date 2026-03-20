import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'fallback-secret-key-123';
const FALLBACK_API_KEY = process.env.FALLBACK_GEMINI_API_KEY;

app.use(express.json());

// --- API Key Encryption/Decryption ---

app.post('/api/keys/encrypt', (req, res) => {
  const { apiKey, userId } = req.body;
  if (!apiKey || !userId) {
    return res.status(400).json({ error: 'Missing apiKey or userId' });
  }

  try {
    // Encrypt the API key using a combination of global secret and userId
    const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_SECRET + userId).toString();
    res.json({ success: true, encryptedKey: encrypted });
  } catch (err) {
    console.error('Encryption error:', err);
    res.status(500).json({ error: 'Failed to encrypt key' });
  }
});

// This endpoint would normally be used internally or by a very secure client
// In a real app, you'd verify the user's session before decrypting
app.post('/api/keys/decrypt', (req, res) => {
  const { userId, encryptedKey } = req.body;
  
  // In a real app, we'd fetch the encrypted key from Firestore here
  // But for this demo, we'll assume the client might pass it or we fetch it
  // For now, let's just return a success if we have a fallback or a way to get it
  
  // Actually, the client in Generate.tsx calls this to get the key.
  // We should probably fetch from Firestore here if we had the admin SDK.
  // Since we don't have the admin SDK easily set up here, we'll rely on the client
  // sending the encrypted key if they have it, or we use the fallback.
  
  const keyToDecrypt = encryptedKey;

  if (!keyToDecrypt) {
    // If no user key, return the fallback key (if available)
    if (FALLBACK_API_KEY) {
      return res.json({ success: true, apiKey: FALLBACK_API_KEY, isFallback: true });
    }
    return res.status(404).json({ error: 'No API key found' });
  }

  try {
    const bytes = CryptoJS.AES.decrypt(keyToDecrypt, ENCRYPTION_SECRET + userId);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) throw new Error('Decryption failed');
    
    res.json({ success: true, apiKey: decrypted, isFallback: false });
  } catch (err) {
    console.error('Decryption error:', err);
    // If decryption fails, try fallback
    if (FALLBACK_API_KEY) {
      return res.json({ success: true, apiKey: FALLBACK_API_KEY, isFallback: true });
    }
    res.status(500).json({ error: 'Failed to decrypt key and no fallback available' });
  }
});

// --- AI Generation Proxy (Optional but more secure) ---
// We could move the actual @google/genai calls here to never expose keys to the client.
// For now, the client handles it with the decrypted key for simplicity in this demo.

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
