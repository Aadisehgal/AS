import {NativeModules} from 'react-native';

const {AppIntents} = NativeModules;

interface WiFiNetwork {
  ssid: string;
  bssid: string;
  frequency: number;
  level: number;
  capabilities: string;
}

export async function scanWiFiNetworks(): Promise<WiFiNetwork[]> {
  try {
    const result = await AppIntents.scanWiFiNetworks();
    return JSON.parse(result);
  } catch (e) {
    return [];
  }
}

export async function getWiFiInfo(): Promise<any> {
  try {
    const result = await AppIntents.getWiFiInfo();
    return JSON.parse(result);
  } catch (e) {
    return {};
  }
}
