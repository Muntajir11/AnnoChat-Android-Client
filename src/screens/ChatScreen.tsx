"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Dimensions, Animated, Easing } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ChatWindow } from "../components/ChatWindow"
import { MessageInput } from "../components/MessageInput"
import { Header } from "../components/Header"
import type { Message } from "../../types"

interface ChatScreenProps {
  messages: Message[]
  isTyping: boolean
  onlineUsers: number
  status: string
  onMenuPress?: () => void
  onSendMessage: (text: string) => void
  onChangeText: (text: string) => void
}

const { width, height } = Dimensions.get("window")

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  isTyping,
  onlineUsers,
  status,
  onMenuPress,
  onSendMessage,
  onChangeText,
}) => {
  const insets = useSafeAreaInsets()
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  // Particle animation refs
  const particleAnim1 = useRef(new Animated.Value(0)).current
  const particleAnim2 = useRef(new Animated.Value(0)).current
  const particleAnim3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true)
    })
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false)
    })

    // Floating particles - constrained within safe area
    const particleAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim1, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim1, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )

    const particleAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim2, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim2, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )

    const particleAnimation3 = Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim3, {
          toValue: 1,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim3, {
          toValue: 0,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )

    particleAnimation1.start()
    particleAnimation2.start()
    particleAnimation3.start()

    return () => {
      keyboardDidHideListener?.remove()
      keyboardDidShowListener?.remove()
      particleAnimation1.stop() // Stop particle animations on unmount
      particleAnimation2.stop()
      particleAnimation3.stop()
    }
  }, [])

  // Particle animations - constrained within safe area
  const particleTopBound = 100 // Particles won't go above this Y coordinate
  const safeAreaHeight = height - particleTopBound

  const particle1Y = particleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [safeAreaHeight, particleTopBound],
  })

  const particle2Y = particleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [safeAreaHeight, particleTopBound],
  })

  const particle3Y = particleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [safeAreaHeight, particleTopBound],
  })

  const particle1Opacity = particleAnim1.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.6, 0.6, 0],
  })

  const particle2Opacity = particleAnim2.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.4, 0.4, 0],
  })

  const particle3Opacity = particleAnim3.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.3, 0.3, 0],
  })

  return (
    <View style={styles.container}>

       <Animated.View
        style={[
          styles.particle,
          styles.particle1,
          {
            transform: [{ translateY: particle1Y }],
            opacity: particle1Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          styles.particle2,
          {
            transform: [{ translateY: particle2Y }],
            opacity: particle2Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          styles.particle3,
          {
            transform: [{ translateY: particle3Y }],
            opacity: particle3Opacity,
          },
        ]}
      />

      <Header isConnected={true} onlineUsers={onlineUsers} status={status} onMenuPress={onMenuPress} />
      <KeyboardAvoidingView
        style={styles.chatContent}
        behavior={Platform.OS === "ios" ? "padding" : isKeyboardVisible ? "height" : undefined}
        keyboardVerticalOffset={0}
      >
        <ChatWindow messages={messages} isTyping={isTyping} />
        <View style={styles.inputContainer}>
          <MessageInput onSendMessage={onSendMessage}  onChangeText={onChangeText} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23", // Dark background color
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    zIndex: 0, // Behind content
  },
  particle1: {
    left: "20%",
    backgroundColor: "#4ECDC4",
  },
  particle2: {
    left: "70%",
    backgroundColor: "#8B5CF6",
  },
  particle3: {
    left: "85%",
    backgroundColor: "#FF6B6B",
  },
  chatContent: {
    flex: 1,
  },
  inputContainer: {
    // This style is now primarily for the container of MessageInput,
    // MessageInput itself handles its background and padding.
    // Keeping it here for consistency with original structure.
  },
})
