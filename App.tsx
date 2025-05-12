import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreens from './src/components/WelcomeScreens';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { MainApp } from './src/MainApp';
import { SettingsScreen } from './src/screens/SettingsScreen'; // create this screen

const Stack = createStackNavigator();

const App = () => {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      {showWelcome ? (
        <WelcomeScreens onDone={handleDoneWelcome} />
      ) : (
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainApp} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});

export default App;
