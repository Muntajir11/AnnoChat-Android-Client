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
    backgroundColor: "rgba(30, 30, 50, 0.8)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    fontWeight: "500",
  },
  messagesContent: {
    paddingHorizontal: 5,
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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: "#6B46C1",
    borderBottomRightRadius: 6,
  },
  strangerMessageBubble: {
    backgroundColor: "rgba(60, 60, 80, 0.9)",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  userMessageText: {
    color: "#FFFFFF",
    fontWeight: "400",
  },
  strangerMessageText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "400",
  },
  timestamp: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
    alignSelf: "flex-end",
    fontWeight: "400",
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  systemMessageText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    fontWeight: "400",
  },
  typingContainer: {
    paddingHorizontal: 5,
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  typingBubble: {
    backgroundColor: "rgba(60, 60, 80, 0.9)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  typingText: {
    fontStyle: "italic",
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "400",
  },
  footerSpacer: {
    height: 12,
  },
})
