import { MainApp } from './src/MainApp';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreens from './src/components/WelcomeScreens';


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
      {showWelcome ? <WelcomeScreens onDone={handleDoneWelcome} /> : <MainApp />}
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
