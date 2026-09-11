import AsyncStorage from '@react-native-async-storage/async-storage';

export const SETTINGS_KEYS = {
  notifications: 'annochat-notifications',
  camera: 'annochat-camera',
  filter: 'annochat-filter',
  age: 'annochat-18',
} as const;

export type CameraFacing = 'user' | 'environment';

export async function getKeywordFilterEnabled() {
  const v = await AsyncStorage.getItem(SETTINGS_KEYS.filter);
  return v !== '0';
}

export async function getDefaultCamera(): Promise<CameraFacing> {
  const v = await AsyncStorage.getItem(SETTINGS_KEYS.camera);
  return v === 'environment' ? 'environment' : 'user';
}
