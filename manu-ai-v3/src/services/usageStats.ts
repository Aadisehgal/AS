import {NativeModules} from 'react-native';

const {UsageStatsManager} = NativeModules;

export function getAppUsage(hours: number): Promise<any[]> {
  return UsageStatsManager.getAppUsage(hours).then((result: string) => JSON.parse(result));
}

export function requestUsageAccess(): Promise<boolean> {
  return UsageStatsManager.requestUsageAccess();
}
