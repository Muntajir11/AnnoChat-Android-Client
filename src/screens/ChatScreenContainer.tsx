"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { BackHandler, View, Alert } from "react-native"
import { ChatScreen } from "./ChatScreen"
import { SideDrawer } from "../components/SideDrawer"
import { useChatContext } from "../contexts/ChatContext"

interface ChatScreenContainerProps {
  navigation: any
  route: any
}

export const ChatScreenContainer: React.FC<ChatScreenContainerProps> = ({ navigation, route }) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false)

  // Use ChatContext instead of route params
  const { messages, isTyping, onlineUsers, status, onSendMessage, onChangeText, disconnectWithAutoSearch, disconnectWithoutAutoSearch } = useChatContext()

  // Handle menu button press to open drawer
  const handleMenuPress = () => {
    setIsDrawerVisible(true)
  }

  // Handle hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      // Show confirmation alert
      Alert.alert("Leave Chat?", "Are you sure you want to leave the chat?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            disconnectWithoutAutoSearch()
          },
        },
      ])
      return true // Prevent default behavior
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction)
    return () => backHandler.remove()
  }, [ navigation])

  return (
    
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ChatScreen
        messages={messages}
        isTyping={isTyping}
        onlineUsers={onlineUsers}
        status={status}
        onMenuPress={handleMenuPress}
        onSendMessage={onSendMessage || (() => {})}
        onChangeText={onChangeText || (() => {})}
      />
      <SideDrawer isVisible={isDrawerVisible} onClose={() => setIsDrawerVisible(false)} navigation={navigation} />
    </View>
  )
}
