import {NativeModules} from 'react-native';

const {AppIntents} = NativeModules;

export async function getClipboardText(): Promise<string> {
  try {
    return await AppIntents.getClipboardText();
  } catch (e) {
    return '';
  }
}

export async function setClipboardText(text: string): Promise<boolean> {
  try {
    return await AppIntents.setClipboardText(text);
  } catch (e) {
    return false;
  }
}
