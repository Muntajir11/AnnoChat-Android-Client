import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Animated, Easing } from "react-native"
import { Header } from "../components/Header"
import { useChatContext } from "../contexts/ChatContext"
import Ionicons from "react-native-vector-icons/Ionicons"
import analytics from "@react-native-firebase/analytics"
import { BackHandler, Alert } from "react-native";


const SERVER_URL = "https://muntajir.me"
import { getTextToken, getTextTokenWithRetry, hasCachedTextToken } from "../utils/textToken"

interface TextChatScreenProps {
  navigation: any
  onMenuPress?: () => void
  onChatStatusChange?: (isConnected: boolean) => void
}

const { width, height } = Dimensions.get("window")

export const TextChatScreen: React.FC<TextChatScreenProps> = ({ navigation, onMenuPress, onChatStatusChange }) => {
  const [isSearching, setIsSearching] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [strangerLeft, setStrangerLeft] = useState(false)
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false) // Add connection state tracking
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const presenceWsRef = useRef<WebSocket | null>(null)
  const presenceConnectingRef = useRef(false)
  const [shouldAutoSearch, setShouldAutoSearch] = useState(false)
  const connectingRef = useRef(false) // Prevent race conditions
  const connectionAttemptRef = useRef<number>(0) // Track connection attempts
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track connection timeout
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  const {
    messages,
    setMessages,
    isTyping: strangerTyping,
    setIsTyping: setStrangerTyping,
    onlineUsers,
    setOnlineUsers,
    status,
    setStatus,
    roomId,
    setRoomId,
    chatWsRef,
    setOnSendMessage,
    setOnDisconnect,
    setOnChangeText,
    disconnectWithAutoSearch,
    disconnectWithoutAutoSearch,
    setDisconnectWithAutoSearch,
    setDisconnectWithoutAutoSearch,
  } = useChatContext()

  const [isConnected, setIsConnected] = useState(false)


  // useEffect(() => {
  //   const onBackPress = () => {
  //     if (roomId) { // Only intercept if user is in a room
  //       Alert.alert(
  //         "Leave Chat?",
  //         "Are you sure you want to leave the chat?",
  //         [
  //           { text: "Cancel", style: "cancel" },
  //           { text: "Leave", style: "destructive", onPress: () => {
  //               leaveRoom();
  //               navigation.goBack();
  //             }
  //           }
  //         ]
  //       );
  //       return true; // Prevent default back navigation
  //     }
  //     return false; // Allow default navigation if not in a room
  //   };

  //   BackHandler.addEventListener("hardwareBackPress", onBackPress);

  //   return () => {
  //     BackHandler.removeEventListener("hardwareBackPress", onBackPress);
  //   };
  // }, [roomId]);

  // Start animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    // Continuous pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )
    pulseAnimation.start()

    return () => pulseAnimation.stop()
  }, [])

  // Searching animation
  useEffect(() => {
    if (isSearching) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      )
      rotateAnimation.start()
    } else {
      rotateAnim.setValue(0)
    }
  }, [isSearching])

  const fetchToken = async () => {
    try {
      const token = await getTextTokenWithRetry(3)
      setAuthToken(token)
    } catch (error) {
      console.error("Failed to fetch token:", error)
      setAuthToken(null)
    }
  }

  useEffect(() => {
    const connectPresence = () => {
      if (
        presenceConnectingRef.current ||
        (presenceWsRef.current &&
          (presenceWsRef.current.readyState === WebSocket.CONNECTING ||
            presenceWsRef.current.readyState === WebSocket.OPEN))
      ) {
        return
      }
      presenceConnectingRef.current = true
      const presenceWs = new WebSocket(
        `${SERVER_URL.replace("http://", "ws://").replace("https://", "wss://")}/presence`,
      )
      presenceWsRef.current = presenceWs

      presenceWs.onopen = () => {
        presenceConnectingRef.current = false
        setStatus("Ready")
      }

      presenceWs.onmessage = (e) => {
        const { event, data } = JSON.parse(e.data)
        if (event === "onlineUsers") {
          setOnlineUsers(data)
        }
      }

      presenceWs.onerror = (error) => {
        presenceConnectingRef.current = false
      }

      presenceWs.onclose = (event) => {
        presenceConnectingRef.current = false

        if (event.code !== 1000 && presenceWsRef.current === presenceWs) {
          setTimeout(() => {
            if (presenceWsRef.current === presenceWs || !presenceWsRef.current) {
              connectPresence()
            }
          }, 3000)
        }
      }
    }

    connectPresence()

    return () => {
      if (presenceWsRef.current) {
        presenceWsRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    fetchToken()
  }, [])

  useEffect(() => {
    if (!authToken) return

    return () => {
      if (chatWsRef.current && chatWsRef.current.close) {
        chatWsRef.current.close()
      }
    }
  }, [authToken])

  useEffect(() => {

    setOnSendMessage(() => (text: string) => {
      if (!text.trim() || !roomId || strangerLeft) return
      setMessages((m) => [
        ...m,
        {
          id: `you-${Date.now()}`,
          text,
          sender: "user",
          timestamp: new Date(),
        },
      ])

      const chat = chatWsRef.current
      if (chat && chat.readyState === WebSocket.OPEN) {
        chat.send(JSON.stringify({ event: "chat message", data: { roomId, msg: text } }))
        chat.send(
          JSON.stringify({
            event: "typing",
            data: { roomId, isTyping: false },
          }),
        )
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    })

    setOnDisconnect(() => () => {
      leaveRoom()
      setShouldAutoSearch(true)
      navigation.goBack()
    })

    // Provide disconnect functions for skip and back button
    setDisconnectWithAutoSearch(() => () => {
      leaveRoom()
      setShouldAutoSearch(true)
      navigation.goBack()
    })

    setDisconnectWithoutAutoSearch(() => () => {
      leaveRoom()
      navigation.goBack()
    })

    setOnChangeText(() => (txt: string) => {
      if (!roomId) return

      const chat = chatWsRef.current
      if (chat && chat.readyState === WebSocket.OPEN) {
        chat.send(JSON.stringify({ event: "typing", data: { roomId, isTyping: true } }))
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

      typingTimeoutRef.current = setTimeout(() => {
        if (chat && chat.readyState === WebSocket.OPEN) {
          chat.send(
            JSON.stringify({
              event: "typing",
              data: { roomId, isTyping: false },
            }),
          )
        }
        typingTimeoutRef.current = null
      }, 1500)
    })
  }, [roomId, strangerLeft, setMessages, setOnSendMessage, setOnDisconnect, setOnChangeText, setDisconnectWithAutoSearch, setDisconnectWithoutAutoSearch])

  useEffect(() => {
    if (isConnected) {
      navigation.navigate("Chat")
    }
  }, [isConnected])

  const connectChat = async () => {
    // Prevent race conditions - only allow one connection attempt at a time
    if (connectingRef.current) {
      console.log("🔄 Connection already in progress, skipping duplicate attempt")
      return
    }

    // Check if we already have a healthy connection
    if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
      console.log("🎯 Using existing healthy chat connection")
      return
    }

    connectingRef.current = true
    setIsConnecting(true)
    const currentAttempt = ++connectionAttemptRef.current

    try {
      // Use cached token when available
      let token = authToken
      if (!token || !hasCachedTextToken()) {
        console.log("🔄 Refreshing text token...")
        token = await getTextTokenWithRetry(3)
        setAuthToken(token)
      }

      if (!token) {
        throw new Error("Failed to get authentication token")
      }

      // Close existing connection if any
      if (chatWsRef.current) {
        chatWsRef.current.close()
        chatWsRef.current = null
      }

      console.log(`🔄 Text chat connection attempt ${currentAttempt} with ${hasCachedTextToken() ? 'cached' : 'fresh'} token`)

      const chatUrl = `${SERVER_URL.replace("http://", "ws://").replace("https://", "wss://")}/?token=${token}`
      const chatWs = new WebSocket(chatUrl)
      chatWsRef.current = chatWs

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (chatWs.readyState === WebSocket.CONNECTING) {
          console.warn("⚠️ Text chat connection timeout")
          chatWs.close()
        }
      }, 10000) // 10 second timeout
      
      connectionTimeoutRef.current = connectionTimeout

      chatWs.onopen = () => {
        clearTimeout(connectionTimeout)
        connectionTimeoutRef.current = null
        console.log("✅ Text chat connected successfully")
        setIsConnecting(false)
        connectingRef.current = false
        connectionAttemptRef.current = 0 // Reset on success
      }

      chatWs.onclose = () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
        connectingRef.current = false
        setIsConnecting(false)
      }

      chatWs.onerror = () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current)
          connectionTimeoutRef.current = null
        }
        connectingRef.current = false
        setIsConnecting(false)
      }

      chatWs.onmessage = (e) => {
        const { event, data } = JSON.parse(e.data)

        switch (event) {
          case "matched":
            setIsSearching(false)
            setIsConnected(true)
            setRoomId(data.roomId)
            setStrangerLeft(false)
            setMessages([
              {
                id: "system-1",
                text: "You are now chatting with a stranger.\nSay hi!",
                sender: "system",
                timestamp: new Date(),
              },
            ])

            chatWs.send(JSON.stringify({ event: "join room", data: data.roomId }))
            break

          case "chat message":
            if (data.senderId !== "self") {
              setMessages((m) => [
                ...m,
                {
                  id: `str-${Date.now()}`,
                  text: data.msg,
                  sender: "stranger",
                  timestamp: new Date(),
                },
              ])
            }
            break

          case "typing":
            if (data.senderId !== "self") {
              setStrangerTyping(data.isTyping)
            }
            break

          case "user disconnected":
            setMessages((prev) => {
              if (prev.some((m) => m.text.includes("Stranger has disconnected"))) return prev
              return [
                ...prev,
                {
                  id: `sysdisc-${Date.now()}`,
                  text: "Stranger has disconnected. Tap Exit to leave.",
                  sender: "system",
                  timestamp: new Date(),
                },
              ]
            })
            setStrangerLeft(true)
            setStrangerTyping(false)
            break

          case "error":
            if (data && data.message === "Auth failed") {
              setStatus("Authentication failed. Please try again.")
              chatWs.close()
              setIsConnected(false)
              setIsSearching(false)
            } else {
              setStatus(`Error: ${data.message || "Unknown error"}`)
            }
            break
        }
      }

      chatWs.onerror = (error) => {
        clearTimeout(connectionTimeout)
        console.error("❌ Text chat WebSocket error:", error)
        setIsSearching(false)
        setStatus("Connection failed.")
        setIsConnecting(false)
        connectingRef.current = false
      }

      chatWs.onclose = (event) => {
        clearTimeout(connectionTimeout)
        console.log("🔌 Text chat WebSocket closed:", event.code, event.reason)
        setIsConnecting(false)
        connectingRef.current = false
        
        if (chatWsRef.current === chatWs) {
          chatWsRef.current = null
        }
        
        // Only attempt reconnection on unexpected closure
        if (event.code !== 1000 && connectionAttemptRef.current < 3) {
          console.log(`🔄 Attempting text chat reconnection ${connectionAttemptRef.current + 1}/3`)
          setTimeout(() => {
            if (connectionAttemptRef.current < 3) {
              connectChat()
            }
          }, 2000 * connectionAttemptRef.current) // Increasing delay
        }
      }
    } catch (error) {
      console.error("❌ Text chat connection error:", error)
      setIsConnecting(false)
      connectingRef.current = false
      setStatus("Failed to connect. Please try again.")
      setIsSearching(false)
    }
  }

  const handleFindChat = async () => {
    if (isButtonDisabled || status !== "Ready") return

    setIsButtonDisabled(true)
    setTimeout(() => setIsButtonDisabled(false), 1500)

    analytics().logEvent("search_started")

    if (isConnected && roomId) leaveRoom()
    setRoomId(null)
    setMessages([])

    if (authToken || hasCachedTextToken()) {
      await connectChat()
      setIsSearching(true)
      setStatus("Searching for a match...")
    } else {
      console.log("Auth token not available yet. Cannot connect to chat.")
    }
  }

  const handleCancelSearch = () => {
    if (isButtonDisabled) return

    setIsButtonDisabled(true)
    setTimeout(() => setIsButtonDisabled(false), 1000)

    if (chatWsRef.current) {
      chatWsRef.current.close()
      chatWsRef.current = null
    }
    setIsSearching(false)
    setStatus("Ready")
  }

  const leaveRoom = () => {
    const chat = chatWsRef.current
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (chat && chat.readyState === WebSocket.OPEN && roomId) {
      chat.send(
        JSON.stringify({
          event: "typing",
          data: { roomId, isTyping: false },
        }),
      )
      chat.send(JSON.stringify({ event: "leave room", data: roomId }))
    }
    if (chat) {
      chat.close()
    }
    setIsConnected(false)
    setRoomId(null)
    setMessages([])
    setStrangerTyping(false)
    setStatus("Ready")
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })


  useEffect(() => {
  if (shouldAutoSearch) {
    setShouldAutoSearch(false)
    handleFindChat()
  }
}, [shouldAutoSearch])

  return (
    <View style={styles.container}>
      <Header isConnected={isConnected} onlineUsers={onlineUsers} status={status} onMenuPress={onMenuPress} />

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        {/* Status Chip - Top Right */}
        <View style={styles.statusContainer}>
          <View style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: status === "Ready" ? "#4ECDC4" : "#FFD93D" }]} />
            <Text style={styles.statusChipText}>{onlineUsers} online</Text>
          </View>
        </View>

        {/* Main Search Interface */}
        <View style={styles.searchInterface}>
          <Animated.View
            style={[
              styles.centralOrb,
              {
                transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }, { rotate: spin }],
              },
            ]}
          >
            <View style={styles.orbInner}>
              {isSearching ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <Ionicons name="planet" size={60} color="#FFFFFF" />
              )}
            </View>

            {/* Orbital rings */}
            <View style={styles.orbitalRing1} />
            <View style={styles.orbitalRing2} />
            <View style={styles.orbitalRing3} />
          </Animated.View>

          <Text style={styles.mainTitle}>{isSearching ? "Searching Universe..." : "Discover Someone New"}</Text>

          <Text style={styles.subtitle}>
            {isSearching
              ? "Finding your perfect conversation partner"
              : "Connect instantly with fascinating people worldwide"}
          </Text>
        </View>

        {/* Centered Quick Match Button */}
        <View style={styles.centerActionContainer}>
          <TouchableOpacity
            style={[
              styles.quickMatchButton,
              isSearching && styles.quickMatchButtonActive,
              (isButtonDisabled || (status !== "Ready" && !isSearching)) && styles.quickMatchButtonDisabled,
            ]}
            onPress={isSearching ? handleCancelSearch : handleFindChat}
            disabled={isButtonDisabled || (status !== "Ready" && !isSearching)}
          >
            <Ionicons name={isSearching ? "stop-circle" : "flash"} size={24} color="#FFFFFF" />
            <Text
              style={[
                styles.quickMatchButtonText,
                (isButtonDisabled || (status !== "Ready" && !isSearching)) && styles.quickMatchButtonDisabledText,
              ]}
            >
              {isSearching ? "Stop" : "Quick Match"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusContainer: {
    alignItems: "flex-end",
    marginTop: 20,
    marginBottom: 20,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(78, 205, 196, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(78, 205, 196, 0.2)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipText: {
    color: "#4ECDC4",
    fontSize: 13,
    fontWeight: "600",
  },
  searchInterface: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centralOrb: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    position: "relative",
  },
  orbInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  orbitalRing1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
    borderStyle: "dashed",
  },
  orbitalRing2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(78, 205, 196, 0.2)",
  },
  orbitalRing3: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 211, 61, 0.15)",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  centerActionContainer: {
    alignItems: "center",
    paddingBottom: 140, // Space for tabs
  },
  quickMatchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 12,
    minWidth: 180,
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  quickMatchButtonActive: {
    backgroundColor: "#FF6B6B",
    shadowColor: "#FF6B6B",
  },
  quickMatchButtonDisabled: {
    backgroundColor: "#374151",
    shadowOpacity: 0.1,
    shadowColor: "#000000",
    opacity: 0.6,
  },
  quickMatchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  quickMatchButtonDisabledText: {
    color: "#9CA3AF",
  },
})
