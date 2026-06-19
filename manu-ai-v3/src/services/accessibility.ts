import {NativeModules, NativeEventEmitter} from 'react-native';

const {AccessibilityManager} = NativeModules;
const accessibilityEmitter = new NativeEventEmitter(AccessibilityManager);

export function performTap(x: number, y: number): Promise<boolean> {
  return AccessibilityManager.performTap(x, y);
}

export function performSwipe(startX: number, startY: number, endX: number, endY: number): Promise<boolean> {
  return AccessibilityManager.performSwipe(startX, startY, endX, endY);
}

export function findAndClick(text: string): Promise<boolean> {
  return AccessibilityManager.findAndClick(text);
}

export function getCurrentScreenInfo(): Promise<any> {
  return AccessibilityManager.getCurrentScreenInfo().then((result: string) => JSON.parse(result));
}

export function requestAccessibilityAccess(): Promise<boolean> {
  return AccessibilityManager.requestAccessibilityAccess();
}

export function onAccessibilityEvent(callback: (event: any) => void) {
  return accessibilityEmitter.addListener('onAccessibilityEvent', (data: string) => {
    callback(JSON.parse(data));
  });
}
