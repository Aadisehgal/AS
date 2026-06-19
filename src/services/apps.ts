import {NativeModules} from 'react-native';
import type {AppInfo, Contact} from '../types';

const {AppIntents} = NativeModules;

export async function getInstalledApps(): Promise<AppInfo[]> {
  const result = await AppIntents.getInstalledApps();
  return JSON.parse(result);
}

export async function openApp(packageName: string): Promise<boolean> {
  return AppIntents.openApp(packageName);
}

export async function openWhatsAppChat(phoneNumber: string, message?: string): Promise<boolean> {
  return AppIntents.openWhatsAppChat(phoneNumber, message || '');
}

export async function openWhatsAppCall(phoneNumber: string, isVideo: boolean = false): Promise<boolean> {
  return AppIntents.openWhatsAppCall(phoneNumber, isVideo);
}

export async function openWhatsAppStatus(): Promise<boolean> {
  return AppIntents.openWhatsAppStatus();
}

export async function openTikTok(): Promise<boolean> {
  return AppIntents.openTikTok();
}

export async function openYouTubeSearch(query: string): Promise<boolean> {
  return AppIntents.openYouTubeSearch(query);
}

export async function openYouTubeVideo(videoId: string): Promise<boolean> {
  return AppIntents.openYouTubeVideo(videoId);
}

export async function makePhoneCall(phoneNumber: string): Promise<boolean> {
  return AppIntents.makePhoneCall(phoneNumber);
}

export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  return AppIntents.sendSMS(phoneNumber, message);
}

export async function toggleFlashlight(enable: boolean): Promise<boolean> {
  return AppIntents.toggleFlashlight(enable);
}

export async function setVolume(level: number): Promise<boolean> {
  return AppIntents.setVolume(level);
}

export async function getContacts(): Promise<Contact[]> {
  const result = await AppIntents.getContacts();
  return JSON.parse(result);
}

export async function openAppSettings(packageName: string): Promise<boolean> {
  return AppIntents.openAppSettings(packageName);
}
