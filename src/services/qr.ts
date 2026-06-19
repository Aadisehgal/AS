import {NativeModules} from 'react-native';

const {AppIntents} = NativeModules;

export async function generateQRCode(text: string, size: number = 512): Promise<string> {
  try {
    return await AppIntents.generateQRCode(text, size);
  } catch (e) {
    return '';
  }
}

// ✅ Now returns the actual decoded QR content (or null if cancelled/unavailable)
export async function scanQRCode(): Promise<string | null> {
  try {
    const result: string = await AppIntents.scanQRCode();
    return result;
  } catch (e) {
    return null;
  }
}
