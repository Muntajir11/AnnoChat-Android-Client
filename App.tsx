"use client"

import { useState, useEffect } from "react"
import { View, StatusBar, StyleSheet } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import WelcomeScreens from "./src/components/WelcomeScreens"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { MainApp } from "./src/MainApp"
import { SettingsScreen } from "./src/screens/SettingsScreen"
import { AboutScreen } from "./src/screens/AboutScreen"
import { SupportFeedbackScreen } from "./src/screens/SupportFeedBackScreen"

const Stack = createStackNavigator()

const App = () => {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null)

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched")
      setShowWelcome(hasLaunched === null)
    }
    checkFirstLaunch()
  }, [])

  const handleDoneWelcome = async () => {
    await AsyncStorage.setItem("hasLaunched", "true")
    setShowWelcome(false)
  }

  if (showWelcome === null) return null

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" translucent={false} hidden={false} />
      {showWelcome ? (
        <WelcomeScreens onDone={handleDoneWelcome} />
      ) : (
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: "#0A0A0F" },
            }}
          >
            <Stack.Screen name="Main" component={MainApp} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="SupportFeedback" component={SupportFeedbackScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F", // Match main app background
    borderWidth: 0,
    margin: 0,
    padding: 0,
  },
})

export default App
