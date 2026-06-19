import {NativeModules} from 'react-native';

const {AppIntents} = NativeModules;

interface SensorData {
  accelerometer: {x: number; y: number; z: number};
  gyroscope: {x: number; y: number; z: number};
  magnetometer: {x: number; y: number; z: number};
  proximity: number;
  light: number;
}

export async function getSensorData(): Promise<SensorData | null> {
  try {
    const result = await AppIntents.getSensorData();
    return JSON.parse(result);
  } catch (e) {
    return null;
  }
}
