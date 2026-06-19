import {NativeModules} from 'react-native';

const {AppIntents} = NativeModules;

interface BluetoothDevice {
  name: string;
  address: string;
  rssi: number;
  type: string;
}

export async function scanBluetoothDevices(): Promise<BluetoothDevice[]> {
  try {
    const result = await AppIntents.scanBluetoothDevices();
    return JSON.parse(result);
  } catch (e) {
    return [];
  }
}
