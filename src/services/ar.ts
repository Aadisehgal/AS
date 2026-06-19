import {NativeModules} from 'react-native';

const {AppIntents} = NativeModules;

export async function startAROverlay(): Promise<boolean> {
  try {
    return await AppIntents.startAROverlay();
  } catch (e) {
    return false;
  }
}

export async function stopAROverlay(): Promise<boolean> {
  try {
    return await AppIntents.stopAROverlay();
  } catch (e) {
    return false;
  }
}
