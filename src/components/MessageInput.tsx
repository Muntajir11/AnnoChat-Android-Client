"use client"

import type React from "react"
import { useState } from "react"
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"

interface MessageInputProps {
  onSendMessage: (text: string) => void
  onDisconnect: () => void
  onChangeText: (text: string) => void
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onDisconnect, onChangeText }) => {
  const [message, setMessage] = useState("")

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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect} activeOpacity={0.7}>
        <Icon name="log-out-outline" size={16} color="#F1F5F9" />
        <Text style={styles.disconnectText}>End</Text>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="rgba(203, 213, 225, 0.5)"
          value={message}
          onChangeText={handleChangeText}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={true}
        />
      </View>

      <TouchableOpacity
        style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!message.trim()}
        activeOpacity={0.7}
      >
        <Icon name="send" size={20} color="#F1F5F9" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
    backgroundColor: "#0F172A",
    borderTopWidth: 1,
    borderTopColor: "rgba(52, 211, 153, 0.2)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    height: 48,
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: "#475569",
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.3)",
    elevation: 2,
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disconnectText: {
    color: "#F1F5F9",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "#334155",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    marginRight: 12,
    minHeight: 48,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
    elevation: 2,
    shadowColor: "#334155",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  input: {
    color: "#F1F5F9",
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 120,
    padding: 0,
    margin: 0,
    fontWeight: "400",
  },
  sendButton: {
    backgroundColor: "#10B981",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
    elevation: 4,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#475569",
    borderColor: "rgba(148, 163, 184, 0.3)",
    shadowColor: "#475569",
    shadowOpacity: 0.1,
    opacity: 0.6,
  },
})
