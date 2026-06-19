import {NativeModules, NativeEventEmitter} from 'react-native';
import Tts from 'react-native-tts';

const {SpeechRecognition} = NativeModules;
const speechEmitter = new NativeEventEmitter(SpeechRecognition);

let speechListeners: any[] = [];

export function initializeTTS(language: string): Promise<void> {
  return new Promise((resolve) => {
    Tts.setDefaultLanguage(language === 'hi' ? 'hi-IN' : 'en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);
    resolve();
  });
}

export function speak(text: string, onStart?: () => void, onFinish?: () => void): Promise<void> {
  return new Promise((resolve) => {
    Tts.stop();
    if (onStart) onStart();

    Tts.speak(text);

    const finishListener = Tts.addListener('tts-finish', () => {
      finishListener.remove();
      if (onFinish) onFinish();
      resolve();
    });
  });
}

export function stopSpeaking(): void {
  Tts.stop();
}

export function startSpeechRecognition(
  locale: string,
  continuous: boolean,
  onResult: (text: string, isFinal: boolean) => void,
  onStatus: (status: string) => void,
  onVolume: (rms: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Remove old listeners
    speechListeners.forEach(l => l.remove());
    speechListeners = [];

    const resultListener = speechEmitter.addListener('onSpeechResult', (event: any) => {
      onResult(event.text, true);
    });

    const partialListener = speechEmitter.addListener('onSpeechPartial', (event: any) => {
      onResult(event.text, false);
    });

    const statusListener = speechEmitter.addListener('onSpeechStatus', (event: any) => {
      onStatus(event.status);
    });

    const volumeListener = speechEmitter.addListener('onSpeechVolume', (event: any) => {
      onVolume(event.rms);
    });

    speechListeners = [resultListener, partialListener, statusListener, volumeListener];

    SpeechRecognition.startListening(locale, continuous)
      .then(() => resolve())
      .catch((err: any) => reject(err));
  });
}

export function stopSpeechRecognition(): Promise<void> {
  return SpeechRecognition.stopListening();
}

export function destroySpeechRecognition(): Promise<void> {
  speechListeners.forEach(l => l.remove());
  speechListeners = [];
  return SpeechRecognition.destroy();
}

export function isSpeechAvailable(): Promise<boolean> {
  return SpeechRecognition.isAvailable();
}
