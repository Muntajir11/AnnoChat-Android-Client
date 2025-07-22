import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const requestCameraAndMicrophonePermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const cameraPermission = granted[PermissionsAndroid.PERMISSIONS.CAMERA];
      const audioPermission = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

      if (
        cameraPermission === PermissionsAndroid.RESULTS.GRANTED &&
        audioPermission === PermissionsAndroid.RESULTS.GRANTED
      ) {
        return true;
      } else {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are required for video chat.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request permissions. Please enable camera and microphone permissions in settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  return true;
};

export const checkCameraAndMicrophonePermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const cameraPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      const audioPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      return cameraPermission && audioPermission;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  return true;
};
