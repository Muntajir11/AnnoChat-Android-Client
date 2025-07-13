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
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 50)
    }
  }, [messages.length])

  // 2) Typing indicator → scroll
  React.useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 50)
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
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.strangerMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.strangerMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.strangerMessageText,
            ]}
          >
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
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A2332",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.15)",
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
    paddingBottom: 16,
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: "#10B981",
    borderBottomRightRadius: 6,
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
  },
  strangerMessageBubble: {
    backgroundColor: "#334155",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
    shadowColor: "#334155",
    shadowOpacity: 0.2,
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
    color: "#F1F5F9",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: "#334155",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  typingContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  typingBubble: {
    backgroundColor: "#475569",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
    elevation: 2,
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  typingText: {
    fontStyle: "italic",
    color: "#6EE7B7",
    fontSize: 12,
    fontWeight: "500",
  },
  footerSpacer: {
    height: 12,
  },
})
