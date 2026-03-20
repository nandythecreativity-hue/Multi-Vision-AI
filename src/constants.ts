export const ANIMATION_STYLES = [
  'Default', 'Realistic', 'Pixar Disney', 'Anime', 'Cyberpunk', 'Cinematic', '3D Render', 'Sketch', 'Oil Painting', 'Digital Art', 'Vibrant',
  'Vogue Editorial', 'National Geographic', 'Synthwave', 'Dark Noir', 'Minimalist', 'Surrealist', 'Street Photography', 'Macro'
];

export const CAMERA_STYLES = [
  'Default', 'Static', 'Pan Left', 'Pan Right', 'Zoom In', 'Zoom Out', 'Drone Shot', 'Handheld', 'Low Angle', 'High Angle'
];

export const SCENE_TYPES = [
  'Default', 'Urban', 'Nature', 'Space', 'Underwater', 'Fantasy', 'Sci-Fi', 'Interior', 'Exterior'
];

export const LIGHTING_STYLES = [
  'Default', 'Natural', 'Studio', 'Neon', 'Golden Hour', 'Moody', 'Bright', 'Cinematic', 'Soft'
];

export const CHARACTER_AGES = [
  'Default', 'Child', 'Teenager', 'Young Adult', 'Adult', 'Middle-aged', 'Elderly'
];

export const CHARACTER_POSES = [
  'Default', 'Standing', 'Walking', 'Sitting', 'Running', 'Dancing', 'Posing', 'Action'
];

export const CAMERA_STYLE_DESCRIPTIONS: Record<string, string> = {
  'Default': 'Standard cinematic camera work.',
  'Static': 'Fixed camera position, no movement, focus on the subject.',
  'Pan Left': 'Smoothly panning the camera from right to left.',
  'Pan Right': 'Smoothly panning the camera from left to right.',
  'Zoom In': 'Gradually zooming the camera in towards the central subject.',
  'Zoom Out': 'Gradually zooming the camera out to reveal more of the scene.',
  'Drone Shot': 'High-altitude aerial view with smooth sweeping motion, like a drone.',
  'Handheld': 'Dynamic, slightly shaky handheld camera movement for a realistic, immersive feel.',
  'Low Angle': 'Camera positioned low, looking up at the subject to make it appear grand and powerful.',
  'High Angle': 'Camera positioned high, looking down at the subject for a comprehensive overview.'
};

export const STYLE_PRESETS = [
  { name: 'Cinematic', icon: '🎬', prompt: 'cinematic lighting, 8k, highly detailed, professional color grading' },
  { name: 'Cyberpunk', icon: '🌃', prompt: 'neon lights, futuristic city, rainy night, synthwave aesthetic' },
  { name: 'Anime', icon: '🌸', prompt: 'studio ghibli style, vibrant colors, hand-drawn texture' },
  { name: '3D Render', icon: '🧊', prompt: 'unreal engine 5, ray tracing, octane render, soft shadows' },
  { name: 'Vintage', icon: '🎞️', prompt: '16mm film, grain, nostalgic, warm tones' },
  { name: 'Dreamy', icon: '✨', prompt: 'ethereal, soft focus, pastel colors, magical atmosphere' },
];
