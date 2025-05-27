"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Ionicons from "react-native-vector-icons/Ionicons"
import LinearGradient from "react-native-linear-gradient"
import io, { type Socket } from "socket.io-client"
import { Header } from "./components/Header"
import { ChatWindow } from "./components/ChatWindow"
import { MessageInput } from "./components/MessageInput"
import type { Message } from "../types"

const SERVER_URL = "https://muntajir.me"
const SOCKET_TOKEN_URL = "https://www.annochat.social/api/get-socket-token"
const { width, height } = Dimensions.get("window")

export const MainApp = ({ navigation }: any) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [roomId, setRoomId] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<number>(0)
  const [strangerTyping, setStrangerTyping] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("Welcome!")
  const [strangerLeft, setStrangerLeft] = useState(false)

  // Interactive elements
  const [touchRipples, setTouchRipples] = useState<Array<{ id: number; x: number; y: number; anim: Animated.Value }>>(
    [],
  )
  const [draggedParticle, setDraggedParticle] = useState<number | null>(null)

  // Animation values for chat bubbles
  const floatAnim1 = useRef(new Animated.Value(0)).current
  const floatAnim2 = useRef(new Animated.Value(0)).current
  const floatAnim3 = useRef(new Animated.Value(0)).current
  const floatAnim4 = useRef(new Animated.Value(0)).current
  const floatAnim5 = useRef(new Animated.Value(0)).current

  // Interactive particle system (reduced to 25 for better performance)
  const particleX = useRef(Array.from({ length: 25 }, () => new Animated.Value(Math.random() * width))).current
  const particleY = useRef(Array.from({ length: 25 }, () => new Animated.Value(Math.random() * height))).current
  const particleOpacity = useRef(
    Array.from({ length: 25 }, () => new Animated.Value(Math.random() * 0.8 + 0.2)),
  ).current
  const particleScale = useRef(Array.from({ length: 25 }, () => new Animated.Value(Math.random() * 0.5 + 0.5))).current

  // Fun floating orbs (reduced to 6)
  const orbX = useRef(Array.from({ length: 6 }, () => new Animated.Value(Math.random() * width))).current
  const orbY = useRef(Array.from({ length: 6 }, () => new Animated.Value(Math.random() * height))).current
  const orbScale = useRef(Array.from({ length: 6 }, () => new Animated.Value(1))).current
  const orbOpacity = useRef(Array.from({ length: 6 }, () => new Animated.Value(0.3))).current

  // Planet animation
  const planetRotate = useRef(new Animated.Value(0)).current
  const planetPulse = useRef(new Animated.Value(1)).current

  // Button pulse animation
  const buttonPulse = useRef(new Animated.Value(1)).current

  const particles = useRef(
    Array.from({ length: 25 }, (_, i) => ({
      x: particleX[i],
      y: particleY[i],
      opacity: particleOpacity[i],
      scale: particleScale[i],
    })),
  ).current

  const orbs = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      x: orbX[i],
      y: orbY[i],
      scale: orbScale[i],
      opacity: orbOpacity[i],
    })),
  ).current

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const socketOnlineRef = useRef<Socket>(
    io(`${SERVER_URL}/presence`, {
      autoConnect: false,
      transports: ["websocket"],
      secure: true,
      path: "/socket.io",
    }),
  )
  const socketChatRef = useRef<Socket | null>(null)

  // Touch interaction handlers
  const handleTouch = (event: any) => {
    const { locationX, locationY } = event.nativeEvent
    const rippleId = Date.now()
    const rippleAnim = new Animated.Value(0)

    setTouchRipples((prev) => [...prev, { id: rippleId, x: locationX, y: locationY, anim: rippleAnim }])

    // Animate ripple
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setTouchRipples((prev) => prev.filter((ripple) => ripple.id !== rippleId))
    })

    // Make nearby particles react
    particles.forEach((particle, index) => {
      // Use a ref to track particle positions for touch interaction
      const particleXValue = Math.random() * width // Fallback to random position
      const particleYValue = Math.random() * height // Fallback to random position

      const distance = Math.sqrt(Math.pow(particleXValue - locationX, 2) + Math.pow(particleYValue - locationY, 2))

      if (distance < 100) {
        // Particle explosion effect
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start()

        // Brightness flash
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.8 + 0.2,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start()
      }
    })
  }

  // Start animations
  useEffect(() => {
    // Chat bubble animations
    const createFloatingAnimation = (animValue: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 },
      ).start()
    }

    // Particle animations
    particles.forEach((particle, index) => {
      // Gentle floating movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.y, {
            toValue: Math.random() * height,
            duration: 8000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: Math.random() * height,
            duration: 8000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 },
      ).start()

      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.x, {
            toValue: Math.random() * width,
            duration: 10000 + Math.random() * 5000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: Math.random() * width,
            duration: 10000 + Math.random() * 5000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 },
      ).start()

      // Gentle twinkling
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.8 + 0.2,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.8 + 0.2,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 },
      ).start()
    })

    // Orb animations
    orbs.forEach((orb, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(orb.x, {
            toValue: Math.random() * width,
            duration: 15000 + Math.random() * 10000,
            useNativeDriver: true,
          }),
          Animated.timing(orb.x, {
            toValue: Math.random() * width,
            duration: 15000 + Math.random() * 10000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 },
      ).start()

      Animated.loop(
        Animated.sequence([
          Animated.timing(orb.y, {
            toValue: Math.random() * height,
            duration: 12000 + Math.random() * 8000,
            useNativeDriver: true,
          }),
          Animated.timing(orb.y, {
            toValue: Math.random() * height,
            duration: 12000 + Math.random() * 8000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 },
      ).start()

      Animated.loop(
        Animated.sequence([
          Animated.timing(orb.scale, {
            toValue: 1.5,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(orb.scale, {
            toValue: 1,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 },
      ).start()
    })

    // Planet animations
    Animated.loop(
      Animated.timing(planetRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
      { iterations: -1 },
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(planetPulse, {
          toValue: 1.1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(planetPulse, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 },
    ).start()

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 },
    ).start()

    // Chat bubble animations
    createFloatingAnimation(floatAnim1, 3000)
    createFloatingAnimation(floatAnim2, 4000)
    createFloatingAnimation(floatAnim3, 3500)
    createFloatingAnimation(floatAnim4, 2800)
    createFloatingAnimation(floatAnim5, 3200)
  }, [])

  const handleTyping = (isTyping: boolean) => {
    if (!roomId || !isConnected) return
    socketChatRef.current?.emit("typing", { roomId, isTyping })
  }

  const fetchToken = async () => {
    try {
      const res = await fetch(SOCKET_TOKEN_URL)
      const data = await res.json()
      setAuthToken(data.token || null)
    } catch {
      console.error("Failed to fetch token")
    }
  }

  useEffect(() => {
    const pres = socketOnlineRef.current
    pres.on("onlineUsers", setOnlineUsers)
    pres.connect()
    return () => {
      pres.disconnect()
      pres.off("onlineUsers", setOnlineUsers)
    }
  }, [])

  useEffect(() => {
    fetchToken()
  }, [])

  useEffect(() => {
    if (!authToken) return

    const chat = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket"],
      secure: true,
      path: "/socket.io",
      auth: { token: authToken },
    })

    socketChatRef.current = chat

    chat.on("matched", ({ roomId: newRoomId }) => {
      setIsSearching(false)
      setIsConnected(true)
      setRoomId(newRoomId)
      setStrangerLeft(false)

      setMessages([
        {
          id: "system-1",
          text: "You are now chatting with a stranger. Say hi!",
          sender: "system",
          timestamp: new Date(),
        },
      ])

      chat.emit("join room", newRoomId)

      setStatus("")
    })

    chat.on("chat message", ({ msg }) => {
      setMessages((m) => [
        ...m,
        {
          id: `str-${Date.now()}`,
          text: msg,
          sender: "stranger",
          timestamp: new Date(),
        },
      ])
    })

    chat.on("typing", ({ isTyping }) => {
      setStrangerTyping(isTyping)
    })

    chat.on("user disconnected", () => {
      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some((m) => m.text === "Stranger has disconnected. Tap Exit to leave.")
        if (alreadyExists) return prevMessages

        return [
          ...prevMessages,
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
    })

    chat.on("connect_error", (err) => {
      console.error("Connection error:", err.message)
      setIsSearching(false)
      setStatus("Connection failed.")
    })

    return () => {
      chat.disconnect()
      chat.removeAllListeners()
    }
  }, [authToken])

  const handleFindChat = () => {
    if (isConnected && roomId) leaveRoom()
    setRoomId(null)
    setMessages([])
    setStatus("Searching for a match...")
    setIsSearching(true)
    socketChatRef.current?.connect()

    // Fun button press effect
    Animated.sequence([
      Animated.timing(buttonPulse, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPulse, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPulse, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const leaveRoom = () => {
    const chat = socketChatRef.current
    if (chat && roomId) {
      chat.emit("leave room", { roomId })
    }

    if (chat && chat.connected) {
      chat.disconnect()
    }

    setIsConnected(false)
    setRoomId(null)
    setMessages([])
    setStrangerTyping(false)
    setStatus("Welcome!")
  }

  const handleSendMessage = (text: string) => {
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

    socketChatRef.current?.emit("chat message", { roomId, msg: text })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    handleTyping(false)
    typingTimeoutRef.current = null
  }

  const handleInputChange = (text: string) => {
    handleTyping(true)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false)
    }, 1500)
  }

  const planetSpin = planetRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <GestureHandlerRootView style={styles.container}>
      {!isConnected ? (
        <TouchableOpacity style={styles.welcomeContainer} activeOpacity={1} onPress={handleTouch}>
          {/* Solid background */}
          <View style={styles.solidBackground} />

          {/* Interactive particle field */}
          <View style={styles.particleField}>
            {particles.map((particle, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    transform: [{ translateX: particle.x }, { translateY: particle.y }, { scale: particle.scale }],
                    opacity: particle.opacity,
                    backgroundColor:
                      index % 4 === 0
                        ? "#8B5CF6"
                        : index % 4 === 1
                          ? "#3B82F6"
                          : index % 4 === 2
                            ? "#10B981"
                            : "#F59E0B",
                  },
                ]}
              />
            ))}
          </View>

          {/* Touch ripples */}
          <View style={styles.rippleField}>
            {touchRipples.map((ripple) => (
              <Animated.View
                key={ripple.id}
                style={[
                  styles.touchRipple,
                  {
                    left: ripple.x - 50,
                    top: ripple.y - 50,
                    transform: [
                      {
                        scale: ripple.anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 3],
                        }),
                      },
                    ],
                    opacity: ripple.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 0],
                    }),
                  },
                ]}
              />
            ))}
          </View>

          {/* Floating orbs */}
          <View style={styles.orbField}>
            {orbs.map((orb, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.orb,
                  {
                    backgroundColor: [
                      "rgba(139, 92, 246, 0.1)",
                      "rgba(59, 130, 246, 0.08)",
                      "rgba(16, 185, 129, 0.06)",
                      "rgba(245, 158, 11, 0.05)",
                    ][index % 4],
                    transform: [{ translateX: orb.x }, { translateY: orb.y }, { scale: orb.scale }],
                    opacity: orb.opacity,
                  },
                ]}
              />
            ))}
          </View>

          {/* Header */}
          <View style={styles.headerContainer}>
            <Header isConnected={isConnected} onlineUsers={onlineUsers} status={status} />
          </View>

          {/* Interactive chat bubbles */}
          <Animated.View
            style={[
              styles.chatBubble1,
              {
                transform: [
                  {
                    translateY: floatAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    }),
                  },
                  { rotate: "-5deg" },
                ],
              },
            ]}
          >
            <Text style={styles.bubbleText}>Hi! 👋</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.chatBubble2,
              {
                transform: [
                  {
                    translateY: floatAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
                    }),
                  },
                  { rotate: "8deg" },
                ],
              },
            ]}
          >
            <Text style={styles.bubbleText}>Hello 🌍</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.chatBubble3,
              {
                transform: [
                  {
                    translateY: floatAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -12],
                    }),
                  },
                  { rotate: "-3deg" },
                ],
              },
            ]}
          >
            <Text style={styles.bubbleText}>Hey! 😊</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.chatBubble4,
              {
                transform: [
                  {
                    translateY: floatAnim4.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -6],
                    }),
                  },
                  { rotate: "12deg" },
                ],
              },
            ]}
          >
            <Text style={styles.bubbleText}>🚀</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.chatBubble5,
              {
                transform: [
                  {
                    translateY: floatAnim5.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -9],
                    }),
                  },
                  { rotate: "-8deg" },
                ],
              },
            ]}
          >
            <Text style={styles.bubbleText}>💬</Text>
          </Animated.View>

          {/* Hero section */}
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Animated.View
                style={[
                  styles.planetContainer,
                  {
                    transform: [{ rotate: planetSpin }, { scale: planetPulse }],
                  },
                ]}
              >
                <View style={styles.planetCore} />
                <View style={styles.planetRing1} />
                <View style={styles.planetRing2} />
                <Ionicons name="planet" size={48} color="#8B5CF6" style={styles.planetIcon} />
              </Animated.View>
            </View>

            <Text style={styles.heroTitle}>
              Connect{"\n"}
              <Text style={styles.heroTitleAccent}>Globally</Text>
            </Text>

            <Text style={styles.heroSubtitle}>
              ✨ Tap anywhere to create magic{"\n"}🚀 Where strangers become stories
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.statText}>100% Anonymous</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={20} color="#F59E0B" />
              <Text style={styles.statText}>Instant Match</Text>
            </View>
          </View>

          {/* Interactive action button */}
          <View style={styles.actionContainer}>
            <View style={styles.buttonContainer}>
              <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
                <TouchableOpacity style={styles.mainButton} onPress={handleFindChat} disabled={isSearching}>
                  <LinearGradient
                    colors={isSearching ? ["#6366F1", "#8B5CF6"] : ["#8B5CF6", "#A855F7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <View style={styles.buttonContent}>
                      {isSearching ? (
                        <>
                          <Ionicons name="search" size={24} color="#FFFFFF" />
                          <Text style={styles.buttonText}>Searching...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
                          <Text style={styles.buttonText}>Start Chatting</Text>
                        </>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {/* Settings button */}
          <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate("Settings")}>
            <View style={styles.settingsIconContainer}>
              <Ionicons name="settings" size={20} color="#E5E7EB" />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <View style={styles.chatContainer}>
          <Header isConnected={isConnected} onlineUsers={onlineUsers} status={status} />
          <ChatWindow messages={messages} isTyping={strangerTyping} />
          <MessageInput onSendMessage={handleSendMessage} onDisconnect={leaveRoom} onChangeText={handleInputChange} />
        </View>
      )}
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  welcomeContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },

  // Solid background
  solidBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0A0A0F",
  },

  // Interactive particle field
  particleField: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },

  // Touch ripples
  rippleField: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: "none",
  },

  touchRipple: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.6)",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },

  // Floating orbs
  orbField: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },

  orb: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },

  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#0A0A0F",
  },

  // Chat bubbles
  chatBubble1: {
    position: "absolute",
    top: 150,
    left: 30,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    zIndex: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatBubble2: {
    position: "absolute",
    top: 230,
    right: 40,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    zIndex: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatBubble3: {
    position: "absolute",
    bottom: 280,
    left: 50,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    zIndex: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatBubble4: {
    position: "absolute",
    top: 300,
    left: 20,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    zIndex: 20,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatBubble5: {
    position: "absolute",
    bottom: 200,
    right: 30,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    zIndex: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  bubbleText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "600",
  },

  // Hero section
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 90,
    zIndex: 30,
  },

  heroIcon: {
    position: "relative",
    marginBottom: 32,
  },

  planetContainer: {
    position: "relative",
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },

  planetCore: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },

  planetRing1: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },

  planetRing2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },

  planetIcon: {
    zIndex: 1,
  },

  heroTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 48,
    marginBottom: 16,
    textShadowColor: "rgba(139, 92, 246, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  heroTitleAccent: {
    color: "#8B5CF6",
  },

  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    fontWeight: "500",
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 32,
    marginBottom: 40,
    zIndex: 30,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  statText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 8,
    fontWeight: "600",
  },

  // Action container
  actionContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    zIndex: 30,
  },

  buttonContainer: {
    borderRadius: 28,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    padding: 2,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  mainButton: {
    borderRadius: 26,
    overflow: "hidden",
  },

  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
    letterSpacing: 0.5,
  },

  // Settings button
  settingsButton: {
    position: "absolute",
    top: 100,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  settingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
})
