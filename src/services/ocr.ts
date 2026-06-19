import {NativeModules} from 'react-native';

const {AppIntents} = NativeModules;

// ✅ Opens camera, captures a photo, runs ML Kit on-device text recognition,
// and returns the actual recognized text (or null if cancelled/failed).
export async function captureAndRecognizeText(): Promise<string | null> {
  try {
    const result: string = await AppIntents.captureAndRecognizeText();
    return result;
  } catch (e) {
    return null;
  }
}
