"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, AppState, Animated } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { TextChatScreen } from "../screens"
import { VideoChatScreen } from "../screens"
import type { VideoChatScreenRef } from "../screens/VideoChatScreenNew"
import { SideDrawer } from "./SideDrawer"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ConnectionManager from "../utils/ConnectionManager"

interface TabNavigatorProps {
  navigation: any
}

type TabType = "text" | "video"

const { width } = Dimensions.get("window")

export const TabNavigator: React.FC<TabNavigatorProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>("text")
  const [isDrawerVisible, setIsDrawerVisible] = useState(false)
  const [hideTabBar, setHideTabBar] = useState(false)
  const [appState, setAppState] = useState(AppState.currentState)
  const videoChatRef = useRef<VideoChatScreenRef>(null)
  const lastConnectionAttempt = useRef<number>(0)
  const reconnectionAttempts = useRef<number>(0)
  const insets = useSafeAreaInsets()
  const connectionManager = useRef(ConnectionManager.getInstance())

  // Tab switching state
  const [isTabSwitching, setIsTabSwitching] = useState(false)
  const tabSwitchTimeout = useRef<NodeJS.Timeout | null>(null)

  const slideAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      console.log(`App state changed: ${appState} → ${nextAppState}`)
      
      if (appState === 'background' && nextAppState === 'active') {
        // App returned from background - potentially reconnect if needed
        console.log("🔄 App returned from background, checking connections...")
        
        // Give a moment for the app to settle
        setTimeout(() => {
          if (activeTab === "video" && videoChatRef.current) {
            console.log("🎥 Ensuring video connection is healthy after background return")
            // The ConnectionManager will automatically validate and restore connection
          }
        }, 1000)
      }
      
      setAppState(nextAppState)
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => subscription?.remove()
  }, [appState, activeTab])

  useEffect(() => {
    // Clean up when unmounting
    return () => {
      if (tabSwitchTimeout.current) {
        clearTimeout(tabSwitchTimeout.current)
      }
    }
  }, [])

  const handleTabSwitch = (newTab: TabType) => {
    if (isTabSwitching || activeTab === newTab) {
      console.log(`⏭️ Tab switch ignored: switching=${isTabSwitching}, same=${activeTab === newTab}`)
      return
    }

    console.log(`🔄 Switching from ${activeTab} to ${newTab} tab`)
    setIsTabSwitching(true)

    // Clear any existing timeout
    if (tabSwitchTimeout.current) {
      clearTimeout(tabSwitchTimeout.current)
    }

    // Handle connection caching logic
    if (activeTab === "video" && newTab === "text") {
      console.log("📱 Switching from video to text - preserving video connection")
      // Don't disconnect video, just cache the connection
      // The ConnectionManager will keep it alive
    } else if (activeTab === "text" && newTab === "video") {
      console.log("🎥 Switching from text to video - checking cached connection")
      // Reset reconnection attempts for fresh start
      reconnectionAttempts.current = 0
    }

    // Animate tab switch
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: newTab === "text" ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      console.log(`✅ Tab switch animation completed for ${newTab}`)
    })

    setActiveTab(newTab)

    // Reset switching flag after animation
    tabSwitchTimeout.current = setTimeout(() => {
      setIsTabSwitching(false)
      console.log(`🔓 Tab switching unlocked for ${newTab}`)
    }, 500)
  }

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible)
  }

  const handleChatStatusChange = (isConnected: boolean) => {
    setHideTabBar(isConnected)
  }

  const renderFloatingTabs = () => (
    <View style={[styles.floatingTabContainer, { bottom: Math.max(insets.bottom + 20, 40) }]}>
      <View style={styles.floatingTabBar}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (width - 52) / 2 + 6], // Added +6 to account for container padding
                  }),
                },
              ],
            },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.floatingTab, 
            activeTab === "text" && styles.activeFloatingTab,
            isTabSwitching && styles.switchingTab
          ]}
          onPress={() => handleTabSwitch("text")}
          activeOpacity={0.8}
          disabled={isTabSwitching}
        >
          <Ionicons
            name={activeTab === "text" ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
            size={24}
            color={activeTab === "text" ? "#FFFFFF" : "#8B5CF6"}
          />
          <Text style={[styles.floatingTabText, activeTab === "text" && styles.activeFloatingTabText]}>Text</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.floatingTab, 
            activeTab === "video" && styles.activeFloatingTab,
            isTabSwitching && styles.switchingTab
          ]}
          onPress={() => handleTabSwitch("video")}
          activeOpacity={0.8}
          disabled={isTabSwitching}
        >
          <Ionicons
            name={activeTab === "video" ? "videocam" : "videocam-outline"}
            size={24}
            color={activeTab === "video" ? "#FFFFFF" : "#8B5CF6"}
          />
          <Text style={[styles.floatingTabText, activeTab === "video" && styles.activeFloatingTabText]}>Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderContent = () => {
    return (
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {activeTab === "text" ? (
          <TextChatScreen
            navigation={navigation}
            onMenuPress={toggleDrawer}
            onChatStatusChange={handleChatStatusChange}
          />
        ) : (
          <VideoChatScreen
            key="video-chat" // Keep consistent key for connection caching
            ref={videoChatRef}
            onMenuPress={toggleDrawer}
            onChatStatusChange={handleChatStatusChange}
            shouldAutoConnect={true}
            shouldDisconnectOnTabSwitch={false} // Keep connection cached
          />
        )}
      </Animated.View>
    )
  }

  return (
    <View style={styles.container}>
      {renderContent()}
      {!hideTabBar && renderFloatingTabs()}

      <SideDrawer isVisible={isDrawerVisible} onClose={() => setIsDrawerVisible(false)} navigation={navigation} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  content: {
    flex: 1,
  },
  floatingTabContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
  },
  floatingTabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 30,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
    position: "relative",
    marginHorizontal: 0, // Ensure no extra margins
  },
  tabIndicator: {
    position: "absolute",
    top: 6,
    left: 6,
    width: (width - 52) / 2 - 12, // Reduced by 12 to account for padding on both sides
    height: 48,
    backgroundColor: "#8B5CF6",
    borderRadius: 24,
  },
  floatingTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  activeFloatingTab: {
    backgroundColor: "transparent",
  },
  switchingTab: {
    opacity: 0.6,
  },
  floatingTabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  activeFloatingTabText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
})

export default TabNavigator