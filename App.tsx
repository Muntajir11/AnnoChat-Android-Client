'use client';

import {useState, useEffect} from 'react';
import {View, StatusBar, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreens from './src/components/WelcomeScreens';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {TabNavigator} from './src/components/TabNavigator';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {AboutScreen} from './src/screens/AboutScreen';
import {SupportFeedbackScreen} from './src/screens/SupportFeedBackScreen';
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import notifee from '@notifee/react-native';
import {registerForegroundNotificationHandler} from './src/notifications/notificationHandler';

const Stack = createStackNavigator();

const App = () => {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  async function requestUserPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted.');
      } else {
        console.log('Notification permission denied.');
      }
    }
  }

  // const getToken = async () => {
  //   const token = await messaging().getToken();
  //   console.log('FCM Token:', token);

  // }

  useEffect(() => {
    requestUserPermission();
    // getToken();
    registerForegroundNotificationHandler();
  }, []);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      setShowWelcome(hasLaunched === null);
    };
    checkFirstLaunch();
  }, []);

  const handleDoneWelcome = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    setShowWelcome(false);
  };

  if (showWelcome === null) return null;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#064E3B"
        translucent={false}
        hidden={false}
      />
      {showWelcome ? (
        <WelcomeScreens onDone={handleDoneWelcome} />
      ) : (
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: {backgroundColor: '#064E3B'},
            }}>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="SupportFeedback" component={SupportFeedbackScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064E3B', 
    borderWidth: 0,
    margin: 0,
    padding: 0,
  },
});

export default App;
