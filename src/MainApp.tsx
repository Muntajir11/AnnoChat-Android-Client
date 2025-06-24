"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AnimatedBackground } from "./components/AnimatedBackground"
import { ChatWindow } from "./components/ChatWindow"
import { MessageInput } from "./components/MessageInput"
import { Header } from "./components/Header"
import type { Message } from "../types"
import Ionicons from "react-native-vector-icons/Ionicons"
import analytics from "@react-native-firebase/analytics"

const SERVER_URL = "http://10.0.2.2:5000"
const SOCKET_TOKEN_URL = "http://10.0.2.2:3000/api/get-socket-token"

export const MainApp: React.FC<any> = ({ navigation }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [roomId, setRoomId] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [strangerTyping, setStrangerTyping] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [status, setStatus] = useState("Connecting...")
  const [strangerLeft, setStrangerLeft] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const presenceWsRef = useRef<WebSocket | null>(null)
  const chatWsRef = useRef<WebSocket | null>(null)
  const presenceConnectingRef = useRef(false)

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
    const connectPresence = () => {
      if (presenceConnectingRef.current || 
          (presenceWsRef.current && 
           (presenceWsRef.current.readyState === WebSocket.CONNECTING || 
            presenceWsRef.current.readyState === WebSocket.OPEN))) {
        return
      }
        presenceConnectingRef.current = true
      const presenceWs = new WebSocket(`${SERVER_URL.replace('http://', 'ws://')}/presence`)
      presenceWsRef.current = presenceWs
      
      presenceWs.onopen = () => {
        presenceConnectingRef.current = false
        setStatus("Ready")
      }
      
      presenceWs.onmessage = (e) => {
        const { event, data } = JSON.parse(e.data)
        if (event === 'onlineUsers') {
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

  const connectChat = () => {
    if (chatWsRef.current) {
      chatWsRef.current.close()
      chatWsRef.current = null
    }    const chatUrl = `${SERVER_URL.replace('http://', 'ws://')}/?token=${authToken}`
    const chatWs = new WebSocket(chatUrl)
    chatWsRef.current = chatWs

    chatWs.onopen = () => {

    }

    chatWs.onmessage = (e) => {
      const { event, data } = JSON.parse(e.data)
      
      switch (event) {
        case 'matched':
          setIsSearching(false)
          setIsConnected(true)
          setRoomId(data.roomId)
          setStrangerLeft(false)
          setMessages([
            {
              id: "system-1",
              text: "You are now chatting with a stranger. Say hi!",
              sender: "system",
              timestamp: new Date(),
            },
          ])
      
          chatWs.send(JSON.stringify({ event: 'join room', data: data.roomId }))
          setStatus("")
          break

        case 'chat message':
          if (data.senderId !== 'self') { 
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

        case 'typing':
          if (data.senderId !== 'self') { 
            setStrangerTyping(data.isTyping)
          }
          break

        case 'user disconnected':
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

        case 'error':
          if (data && data.message === 'Auth failed') {
            setStatus("Authentication failed. Please try again.")
            chatWs.close()
            setIsConnected(false)
            setIsSearching(false)
          } else {
            setStatus(`Error: ${data.message || 'Unknown error'}`)
          }
          break
      }
    }

    chatWs.onerror = (error) => {
      setIsSearching(false)
      setStatus("Connection failed.")
    }

    chatWs.onclose = (event) => {
      if (chatWsRef.current === chatWs) {
        chatWsRef.current = null
      }    }
  }

  const handleFindChat = () => {
    analytics().logEvent("search_started")

    if (isConnected && roomId) leaveRoom()
    setRoomId(null)
    setMessages([])

    if (authToken) {
      connectChat()
      setIsSearching(true)
      setStatus("Searching for a match...")
    } else {
      console.log("Auth token not available yet. Cannot connect to chat.")
    }
  }
  const leaveRoom = () => {
    const chat = chatWsRef.current
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (chat && chat.readyState === WebSocket.OPEN && roomId) {
      chat.send(JSON.stringify({ event: "typing", data: { roomId, isTyping: false } }))
      chat.send(JSON.stringify({ event: "leave room", data: roomId }))
    }
    if (chat) {
      chat.close()
    }
    setIsConnected(false)
    setRoomId(null)
    setMessages([])
    setStrangerTyping(false)
    setStatus("Welcome!")
  }
  const handleSendMessage = (text: string) => {
    if (!text.trim() || !roomId || strangerLeft) return
    setMessages((m) => [...m, { id: `you-${Date.now()}`, text, sender: "user", timestamp: new Date() }])
    
    const chat = chatWsRef.current
    if (chat && chat.readyState === WebSocket.OPEN) {
      chat.send(JSON.stringify({ event: "chat message", data: { roomId, msg: text } }))
      chat.send(JSON.stringify({ event: "typing", data: { roomId, isTyping: false } }))
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }
  const handleInputChange = (txt: string) => {
    if (!roomId) return

    const chat = chatWsRef.current
    if (chat && chat.readyState === WebSocket.OPEN) {
      chat.send(JSON.stringify({ event: "typing", data: { roomId, isTyping: true } }))
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    typingTimeoutRef.current = setTimeout(() => {
      if (chat && chat.readyState === WebSocket.OPEN) {
        chat.send(JSON.stringify({ event: "typing", data: { roomId, isTyping: false } }))
      }
      typingTimeoutRef.current = null
    }, 1500)
  }

  const handleTouch = (e: any) => {
 
  }

  const handleOpenWeb = async () => {
    try {
      await analytics().logEvent("web_version_opened")
      await Linking.openURL("https://annochat.social")
    } catch (error) {
      console.error("Failed to open web version:", error)
    }
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {!isConnected ? (
        <View style={{ flex: 1 }}>
          <AnimatedBackground
            isSearching={isSearching}
            onPressFind={handleFindChat}
            status={status}
            onlineUsers={onlineUsers}
            onTouch={handleTouch}
          />
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={async () => {
              await analytics().logEvent("settings_clicked")
              navigation.navigate("Settings")
            }}
          >
            <View style={styles.settingsIconContainer}>
              <Ionicons name="settings" size={20} color="#E5E7EB" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.webButton} onPress={handleOpenWeb}>
            <View style={styles.webIconContainer}>
              <Ionicons name="globe-outline" size={20} color="#E5E7EB" />
            </View>
          </TouchableOpacity>
        </View>
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
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  chatContainer: { flex: 1, backgroundColor: "#0A0A0F" },
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
  webButton: {
    position: "absolute",
    top: 160,
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
  webIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
})
