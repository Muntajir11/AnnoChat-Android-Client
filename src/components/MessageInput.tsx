"use client"

import type React from "react"
import { useChatContext } from "../contexts/ChatContext"
import { useState } from "react"
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"

interface MessageInputProps {
  onSendMessage: (text: string) => void
  onChangeText: (text: string) => void
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onChangeText }) => {
  const [message, setMessage] = useState("")
  const { disconnectWithAutoSearch } = useChatContext()

  const handleChangeText = (text: string) => {
    setMessage(text)
    onChangeText(text)
  }

  const handleSend = () => {
    const trimmed = message.trim()
    if (trimmed) {
      onSendMessage(trimmed)
      setMessage("")
    }
  }

  const handleSkip = () => {
    // Show confirmation alert similar to hardware back button
    Alert.alert(
      "Skip to Next?", 
      "Are you sure you want to skip to the next person?", 
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          style: "destructive",
          onPress: () => {
            disconnectWithAutoSearch()
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.disconnectButton} onPress={handleSkip} activeOpacity={0.7}>
        <Text style={styles.disconnectText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#A0A0B8"
          value={message}
          onChangeText={handleChangeText}
          multiline={true}
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
          enablesReturnKeyAutomatically={true}
          autoCapitalize="sentences"
          autoCorrect={true}
          spellCheck={true}
          scrollEnabled={true}
          keyboardAppearance="dark"
        />
      </View>

      <TouchableOpacity
        style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!message.trim()}
        activeOpacity={0.7}
      >
        <Icon name="send" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "rgba(15, 15, 35, 0.8)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  disconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    height: 45,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  disconnectText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    minHeight: 45,
    maxHeight: 120,
    justifyContent: "center",
    borderWidth: 0,
    borderColor: "transparent",
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    minHeight: 20,
    maxHeight: 96,
    padding: 0,
    margin: 0,
    fontWeight: "400",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  sendButton: {
    backgroundColor: "#4ECDC4",
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    borderColor: "transparent",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(78, 205, 196, 0.3)",
    borderColor: "transparent",
    shadowColor: "transparent",
    shadowOpacity: 0,
    opacity: 0.6,
  },
})
