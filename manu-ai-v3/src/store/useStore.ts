import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';
import type {Settings, Message, Emotion, VoiceProfile} from '../types';

const storage = new MMKV();

interface AppState {
  settings: Settings;
  messages: Message[];
  currentEmotion: Emotion;
  isListening: boolean;
  isSpeaking: boolean;
  lastTranscript: string;
  setSettings: (settings: Partial<Settings>) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setCurrentEmotion: (emotion: Emotion) => void;
  setIsListening: (listening: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setLastTranscript: (transcript: string) => void;
  loadSettings: () => void;
}

const defaultSettings: Settings = {
  apiKey: '',
  assistantName: 'MANU',
  userName: 'User',
  language: 'en',
  currentAvatar: 'aria',
  voiceProfile: null,
};

export const useStore = create<AppState>((set, get) => ({
  settings: defaultSettings,
  messages: [],
  currentEmotion: 'neutral',
  isListening: false,
  isSpeaking: false,
  lastTranscript: '',

  setSettings: (partial) => {
    const newSettings = {...get().settings, ...partial};
    set({settings: newSettings});
    storage.set('settings', JSON.stringify(newSettings));
  },

  addMessage: (message) => {
    const messages = [...get().messages, message];
    set({messages});
    storage.set('messages', JSON.stringify(messages.slice(-100)));
  },

  clearMessages: () => {
    set({messages: []});
    storage.set('messages', '[]');
  },

  setCurrentEmotion: (emotion) => set({currentEmotion: emotion}),
  setIsListening: (listening) => set({isListening: listening}),
  setIsSpeaking: (speaking) => set({isSpeaking: speaking}),
  setLastTranscript: (transcript) => set({lastTranscript: transcript}),

  loadSettings: () => {
    try {
      const saved = storage.getString('settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        set({settings: {...defaultSettings, ...parsed}});
      }
      const savedMessages = storage.getString('messages');
      if (savedMessages) {
        set({messages: JSON.parse(savedMessages)});
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  },
}));
