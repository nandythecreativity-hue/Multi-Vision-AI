export type AppMode = 'video' | 'text-to-image' | 'image-to-image' | 'history';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
export type CharacterModel = 'none' | 'male' | 'female';

export interface HistoryItem {
  id: string;
  type: 'video' | 'image';
  url: string;
  prompt: string;
  timestamp: number;
  operation?: any;
  metadata?: {
    title?: string;
    description?: string;
    hashtags?: string;
  };
}

export interface Product {
  name: string;
  image: string | null;
}
