"use client"

import React from "react"
import { View, Text, StyleSheet, FlatList } from "react-native"
import type { Message } from "../../types"

interface ChatWindowProps {
  messages: Message[]
  isTyping: boolean
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isTyping }) => {
  const flatListRef = React.useRef<FlatList>(null)

  // 1) New message → scroll
  React.useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [messages.length])

  // 2) Typing indicator → scroll
  React.useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isTyping])

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user"
    const isSystem = item.sender === "system"

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      )
    }

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.strangerMessageContainer]}>
        <View style={[styles.messageBubble, isUser ? styles.userMessageBubble : styles.strangerMessageBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.strangerMessageText]}>
            {item.text}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    )
  }

  const renderFooter = () => {
    if (!isTyping) return <View style={styles.footerSpacer} />
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>Stranger is typing…</Text>
        </View>
      </View>
    )
  }

  const keyExtractor = (item: Message, index: number) =>
    item.id ? `${item.id}-${index}` : `message-${index}-${item.timestamp || Date.now()}`

  return (
    <View style={styles.container}>
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Messages will appear here</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderFooter}
          removeClippedSubviews={false}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent", // Set to transparent to allow ChatScreen's background
    elevation: 0, // Removed elevation/shadow as background is handled by parent
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "500",
  },
  messagesContent: {
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  strangerMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 15, // Adjusted to match image
    paddingHorizontal: 15, // Adjusted to match image
    paddingVertical: 10, // Adjusted to match image
    elevation: 0, // Removed elevation/shadow
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  userMessageBubble: {
    backgroundColor: "#8B5CF6", // Purple for user messages
    borderBottomRightRadius: 15, // Keep consistent with borderRadius
  },
  strangerMessageBubble: {
    backgroundColor: "#374151", // Dark grey for stranger messages
    borderBottomLeftRadius: 15, // Keep consistent with borderRadius
    borderWidth: 0, // Removed border
    borderColor: "transparent",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  userMessageText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  strangerMessageText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    alignSelf: "flex-end",
    fontWeight: "400",
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  systemMessageText: {
    color: "#A0A0B8", // Lighter grey for system messages
    fontSize: 15, // Adjusted font size
    fontWeight: "500", // Adjusted font weight
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Transparent background
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20, // Adjusted border radius
    borderWidth: 0, // Removed border
    borderColor: "transparent",
  },
  typingContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  typingBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Dark transparent
    borderRadius: 15, // Adjusted
    paddingHorizontal: 15, // Adjusted
    paddingVertical: 10, // Adjusted
    borderBottomLeftRadius: 15, // Adjusted
    borderWidth: 0, // Removed border
    borderColor: "transparent",
    elevation: 0, // Removed elevation/shadow
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  typingText: {
    fontStyle: "italic",
    color: "#A0A0B8", // Adjusted color
    fontSize: 12,
    fontWeight: "500",
  },
  footerSpacer: {
    height: 4,
  },
})
