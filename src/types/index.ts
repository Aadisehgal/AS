export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  emotion?: string;
}

export interface AppInfo {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
}

export interface Contact {
  name: string;
  phoneNumber: string;
}

export interface VoiceProfile {
  samples: number[][];
  features: number[];
  enrolled: boolean;
}

export interface Settings {
  apiKey: string;
  assistantName: string;
  userName: string;
  language: 'hi' | 'en';
  currentAvatar: string;
  voiceProfile: VoiceProfile | null;
}

export interface AdConfig {
  publisherId: string;
  bannerUnitId: string;
  rewardedUnitId: string;
}

export type Emotion = 'happy' | 'sad' | 'angry' | 'anxious' | 'love' | 'neutral' | 'thinking' | 'excited';

export interface AvatarConfig {
  name: string;
  file: string;
  color: string;
}
