import {useCallback, useEffect, useRef, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {useStore} from '../store/useStore';
import {
  initializeTTS,
  speak,
  stopSpeaking,
  startSpeechRecognition,
  stopSpeechRecognition,
  destroySpeechRecognition,
  isSpeechAvailable,
} from '../services/voice';
import {
  getInstalledApps,
  getContacts,
  openApp,
  makePhoneCall,
  sendSMS,
  toggleFlashlight,
  setVolume,
  openYouTubeSearch,
  openWhatsAppChat,
  openWhatsAppStatus,
  openTikTok,
} from '../services/apps';
import {parseVoiceCommand, executeCommand} from '../utils/commandParser';
import {detectEmotion} from '../utils/emotion';
import {streamChatCompletion} from '../services/openai';
import type {AppInfo, Contact} from '../types';

export function useVoiceControl() {
  const {
    settings,
    messages,
    setIsListening,
    setIsSpeaking,
    setLastTranscript,
    addMessage,
    setCurrentEmotion,
  } = useStore();

  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const continuousListening = useRef(false);
  const processingRef = useRef(false);

  // Load apps and contacts on mount
  useEffect(() => {
    const loadData = async () => {
      try { const apps = await getInstalledApps(); setInstalledApps(apps); } catch {}
      try { const conts = await getContacts(); setContacts(conts); } catch {}
    };
    loadData();
  }, []);

  // Initialize TTS
  useEffect(() => {
    initializeTTS(settings.language)
      .then(() => setIsInitialized(true))
      .catch(() => setError('TTS initialization failed'));
  }, [settings.language]);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ];
      for (const permission of permissions) {
        try {
          await PermissionsAndroid.request(permission, {
            title: 'MANU AI Permission',
            message: 'MANU AI needs this permission to function properly.',
            buttonPositive: 'Allow',
          });
        } catch {}
      }
    }
  }, []);

  const handleVoiceResult = useCallback(async (text: string, isFinal: boolean) => {
    if (!isFinal || processingRef.current) return;
    processingRef.current = true;
    setLastTranscript(text);

    const emotion = detectEmotion(text, settings.language);
    setCurrentEmotion(emotion);

    // Check if it's a device command first
    const command = parseVoiceCommand(text, settings.language, installedApps, contacts);

    if (command) {
      // Execute device command (open app, call, SMS, etc.)
      const response = await executeCommand(command, {
        openApp,
        makeCall: makePhoneCall,
        sendSMS,
        toggleFlashlight,
        setVolume,
        openYouTubeSearch,
        openWhatsAppChat,
        openWhatsAppStatus,
        openTikTok,
      });

      setIsSpeaking(true);
      await speak(response, undefined, () => setIsSpeaking(false));
      addMessage({id: Date.now().toString(), role: 'assistant', content: response, timestamp: Date.now(), emotion});
    } else {
      // ✅ FIXED: Not a command → forward to AI chat with streaming
      if (!settings.apiKey) {
        const noKeyMsg = settings.language === 'hi'
          ? 'कृपया सेटिंग्स में अपना OpenAI API key दर्ज करें।'
          : 'Please enter your OpenAI API key in Settings.';
        setIsSpeaking(true);
        await speak(noKeyMsg, undefined, () => setIsSpeaking(false));
        addMessage({id: Date.now().toString(), role: 'assistant', content: noKeyMsg, timestamp: Date.now()});
        processingRef.current = false;
        return;
      }

      // Add user voice message
      const userMessage = {id: Date.now().toString(), role: 'user' as const, content: text, timestamp: Date.now(), emotion};
      addMessage(userMessage);

      try {
        const lang = settings.language === 'hi' ? 'Hindi' : 'English';
        const systemPrompt = `You are ${settings.assistantName}, a helpful AI assistant for ${settings.userName}. You communicate in ${lang}. Current emotion detected: ${emotion}. Be concise and helpful.`;
        const recentMessages = messages.slice(-10);

        let fullResponse = '';
        for await (const chunk of streamChatCompletion([...recentMessages, userMessage], settings.apiKey, systemPrompt)) {
          fullResponse += chunk;
        }

        const respEmotion = detectEmotion(fullResponse, settings.language);
        setCurrentEmotion(respEmotion);
        addMessage({id: (Date.now() + 1).toString(), role: 'assistant', content: fullResponse, timestamp: Date.now(), emotion: respEmotion});

        // Speak AI response
        if (fullResponse.length < 400) {
          setIsSpeaking(true);
          await speak(fullResponse, undefined, () => setIsSpeaking(false));
        }
      } catch (e) {
        const errMsg = settings.language === 'hi'
          ? 'माफ़ करें, AI से जवाब नहीं मिला।'
          : 'Sorry, could not get AI response. Check your API key.';
        addMessage({id: (Date.now() + 1).toString(), role: 'assistant', content: errMsg, timestamp: Date.now()});
      }
    }

    processingRef.current = false;
  }, [settings, messages, installedApps, contacts, setLastTranscript, setCurrentEmotion, addMessage, setIsSpeaking]);

  const startListening = useCallback(async (continuous: boolean = true) => {
    try {
      await requestPermissions();
      const available = await isSpeechAvailable();
      if (!available) { setError('Speech recognition not available'); return; }

      continuousListening.current = continuous;
      setIsListening(true);
      const locale = settings.language === 'hi' ? 'hi-IN' : 'en-US';

      await startSpeechRecognition(
        locale, continuous, handleVoiceResult,
        (status) => { if (status === 'error') setIsListening(false); },
        (_rms) => {},
      );
    } catch (e) {
      setError(`Failed to start listening: ${e}`);
      setIsListening(false);
    }
  }, [settings.language, requestPermissions, handleVoiceResult, setIsListening]);

  const stopListening = useCallback(async () => {
    continuousListening.current = false;
    setIsListening(false);
    try { await stopSpeechRecognition(); } catch {}
  }, [setIsListening]);

  const speakText = useCallback(async (text: string) => {
    setIsSpeaking(true);
    await speak(text, undefined, () => setIsSpeaking(false));
  }, [setIsSpeaking]);

  useEffect(() => {
    return () => {
      destroySpeechRecognition();
      stopSpeaking();
    };
  }, []);

  return {isInitialized, error, startListening, stopListening, speakText, installedApps, contacts};
}
