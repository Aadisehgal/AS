import {NativeModules, NativeEventEmitter} from 'react-native';

const {NotificationManager} = NativeModules;
const notificationEmitter = new NativeEventEmitter(NotificationManager);

export function getPendingNotifications(): Promise<any[]> {
  return NotificationManager.getPendingNotifications().then((result: string) => JSON.parse(result));
}

export function clearNotifications(): Promise<boolean> {
  return NotificationManager.clearNotifications();
}

export function requestNotificationAccess(): Promise<boolean> {
  return NotificationManager.requestNotificationAccess();
}

export function onNotificationReceived(callback: (notif: any) => void) {
  return notificationEmitter.addListener('onNotificationReceived', (data: string) => {
    callback(JSON.parse(data));
  });
}
