import {useCallback, useRef, useState} from 'react';
import {useStore} from '../store/useStore';
import {streamChatCompletion} from '../services/openai';
import {detectEmotion} from '../utils/emotion';
import {speak, stopSpeaking} from '../services/voice';
import {storeMemory, searchMemories} from '../services/aiMemory';
import type {Message} from '../types';

export function useChat() {
  const {settings, messages, addMessage, setCurrentEmotion, setIsSpeaking} = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateSystemPrompt = useCallback((userText: string) => {
    const emotion = messages.length > 0 ? messages[messages.length - 1].emotion : 'neutral';
    const lang = settings.language === 'hi' ? 'Hindi' : 'English';

    // ✅ AI Memory: pull relevant stored memories into context
    let memoryContext = '';
    try {
      const relevant = searchMemories(userText).slice(0, 5);
      if (relevant.length > 0) {
        memoryContext = `\n\nRelevant things you remember about the user:\n${relevant
          .map(m => `- [${m.category}] ${m.content}`)
          .join('\n')}`;
      }
    } catch {
      // MMKV/memory read failed — continue without memory context
    }

    return `You are ${settings.assistantName}, a helpful AI assistant for ${settings.userName}.
You communicate in ${lang}.
Current detected emotion: ${emotion}.
Respond empathetically to the user's emotional state.
Be concise but helpful. If the user asks to open apps, make calls, or control device features, acknowledge and guide them to use voice commands.
You can also help with ethical hacking tools, password analysis, and security education.${memoryContext}`;
  }, [settings, messages]);

  // ✅ Store useful facts from the conversation into long-term memory
  const maybeStoreMemory = useCallback((userText: string) => {
    // Simple heuristic: store messages that look like personal facts/preferences
    const factPatterns = /\b(my name is|i live in|i like|i love|i hate|i work as|i am a|remember that|don'?t forget)\b/i;
    if (factPatterns.test(userText)) {
      try {
        storeMemory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          category: 'conversation',
          content: userText,
          importance: 6,
        });
      } catch {
        // ignore storage failure
      }
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!settings.apiKey) {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: settings.language === 'hi'
          ? 'कृपया सेटिंग्स में अपना OpenAI API key दर्ज करें।'
          : 'Please enter your OpenAI API key in Settings.',
        timestamp: Date.now(),
      });
      return;
    }

    // Detect emotion from user message
    const emotion = detectEmotion(content, settings.language);
    setCurrentEmotion(emotion);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      emotion,
    };
    addMessage(userMessage);
    maybeStoreMemory(content);

    setIsLoading(true);
    setStreamingText('');

    // ✅ Fresh AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const systemPrompt = generateSystemPrompt(content);
      const recentMessages = messages.slice(-10); // Keep last 10 messages for context

      let fullResponse = '';

      for await (const chunk of streamChatCompletion(
        [...recentMessages, userMessage],
        settings.apiKey,
        systemPrompt,
        controller.signal,
      )) {
        if (controller.signal.aborted) break;
        fullResponse += chunk;
        setStreamingText(fullResponse);
      }

      // ✅ If aborted, don't finalize/add an assistant message at all
      if (controller.signal.aborted) {
        return;
      }

      // Detect emotion from AI response
      const responseEmotion = detectEmotion(fullResponse, settings.language);
      setCurrentEmotion(responseEmotion);

      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now(),
        emotion: responseEmotion,
      });

      // Speak the response if not too long
      if (fullResponse.length < 300) {
        setIsSpeaking(true);
        await speak(fullResponse, undefined, () => setIsSpeaking(false));
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        // Silently stop — user requested it
        return;
      }
      const errorMessage = settings.language === 'hi'
        ? 'माफ़ करें, मैं आपकी मदद नहीं कर सका। कृपया अपना API key जांचें।'
        : 'Sorry, I could not help you. Please check your API key.';

      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
      setStreamingText('');
      abortControllerRef.current = null;
    }
  }, [settings, messages, addMessage, setCurrentEmotion, setIsSpeaking, generateSystemPrompt, maybeStoreMemory]);

  // ✅ Real stop: aborts the in-flight fetch + stream loop
  const stopChat = useCallback(() => {
    stopSpeaking();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStreamingText('');
  }, []);

  return {
    messages,
    isLoading,
    streamingText,
    sendMessage,
    stopChat,
  };
}
