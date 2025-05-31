import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

export async function displayNotification(title, body) {
  await notifee.requestPermission();

  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
    },
  });
}

export function registerForegroundNotificationHandler() {
  messaging().onMessage(async remoteMessage => {
    const { title, body } = remoteMessage.notification || {};
    if (title && body) {
      await displayNotification(title, body);
    }
  });
}
