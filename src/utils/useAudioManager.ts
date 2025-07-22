import { useEffect, useState, useCallback } from 'react';
import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';

const { AudioManagerModule } = NativeModules;

export type AudioDevice = 'SPEAKER' | 'EARPIECE' | 'WIRED_HEADSET' | 'BLUETOOTH';

interface AudioManagerHook {
  currentDevice: AudioDevice | null;
  availableDevices: AudioDevice[];
  isAudioSetup: boolean;
  setupAudioForVideoCall: () => Promise<boolean>;
  switchToSpeaker: () => Promise<boolean>;
  switchToEarpiece: () => Promise<boolean>;
  switchToBluetooth: () => Promise<boolean>;
  getAvailableDevices: () => Promise<AudioDevice[]>;
  getCurrentDevice: () => Promise<AudioDevice>;
  restoreAudioSettings: () => Promise<boolean>;
}

export const useAudioManager = (): AudioManagerHook => {
  const [currentDevice, setCurrentDevice] = useState<AudioDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<AudioDevice[]>([]);
  const [isAudioSetup, setIsAudioSetup] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    // Listen for audio device changes
    const audioDeviceListener = DeviceEventEmitter.addListener(
      'AudioDeviceChanged',
      (device: AudioDevice) => {
        console.log('Audio device changed to:', device);
        setCurrentDevice(device);
      }
    );

    return () => {
      audioDeviceListener.remove();
    };
  }, []);

  const setupAudioForVideoCall = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !AudioManagerModule) {
      console.log('AudioManagerModule not available or not Android');
      return false;
    }

    try {
      console.log('Setting up audio for video call...');
      const result = await AudioManagerModule.setupAudioForVideoCall();
      console.log('Audio setup result:', result);
      
      if (result.success) {
        setIsAudioSetup(true);
        await refreshAudioDevices();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to setup audio for video call:', error);
      return false;
    }
  }, []);

  const switchToSpeaker = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !AudioManagerModule) {
      return false;
    }

    try {
      await AudioManagerModule.switchToSpeaker();
      return true;
    } catch (error) {
      console.error('Failed to switch to speaker:', error);
      return false;
    }
  }, []);

  const switchToEarpiece = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !AudioManagerModule) {
      return false;
    }

    try {
      await AudioManagerModule.switchToEarpiece();
      return true;
    } catch (error) {
      console.error('Failed to switch to earpiece:', error);
      return false;
    }
  }, []);

  const switchToBluetooth = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !AudioManagerModule) {
      return false;
    }

    try {
      await AudioManagerModule.switchToBluetooth();
      return true;
    } catch (error) {
      console.error('Failed to switch to Bluetooth:', error);
      return false;
    }
  }, []);

  const getAvailableDevices = useCallback(async (): Promise<AudioDevice[]> => {
    if (Platform.OS !== 'android' || !AudioManagerModule) {
      return [];
    }

    try {
      const devices = await AudioManagerModule.getAvailableAudioDevices();
      setAvailableDevices(devices);
      return devices;
    } catch (error) {
      console.error('Failed to get available audio devices:', error);
      return [];
    }
  }, []);

  const getCurrentDevice = useCallback(async (): Promise<AudioDevice> => {
    if (Platform.OS !== 'android' || !AudioManagerModule) {
      return 'SPEAKER';
    }

    try {
      const device = await AudioManagerModule.getCurrentAudioDevice();
      setCurrentDevice(device);
      return device;
    } catch (error) {
      console.error('Failed to get current audio device:', error);
      return 'SPEAKER';
    }
  }, []);

  const restoreAudioSettings = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !AudioManagerModule) {
      return false;
    }

    try {
      await AudioManagerModule.restoreAudioSettings();
      setIsAudioSetup(false);
      setCurrentDevice(null);
      setAvailableDevices([]);
      return true;
    } catch (error) {
      console.error('Failed to restore audio settings:', error);
      return false;
    }
  }, []);

  const refreshAudioDevices = useCallback(async () => {
    await getAvailableDevices();
    await getCurrentDevice();
  }, [getAvailableDevices, getCurrentDevice]);

  return {
    currentDevice,
    availableDevices,
    isAudioSetup,
    setupAudioForVideoCall,
    switchToSpeaker,
    switchToEarpiece,
    switchToBluetooth,
    getAvailableDevices,
    getCurrentDevice,
    restoreAudioSettings,
  };
};
