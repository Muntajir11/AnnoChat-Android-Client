'use client'
import React, { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import io, { type Socket } from 'socket.io-client'
import { AnimatedBackground } from './components/AnimatedBackground'
import { ChatWindow } from './components/ChatWindow'
import { MessageInput } from './components/MessageInput'
import { Header } from './components/Header'
import type { Message } from '../types'
import Ionicons from 'react-native-vector-icons/Ionicons'

const SERVER_URL = 'https://muntajir.me'
const SOCKET_TOKEN_URL = 'https://www.annochat.social/api/get-socket-token'

export const MainApp: React.FC<any> = ({ navigation }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [roomId, setRoomId] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [strangerTyping, setStrangerTyping] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [status, setStatus] = useState('Welcome!')
  const [strangerLeft, setStrangerLeft] = useState(false)

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const socketOnlineRef = useRef<Socket>(
    io(`${SERVER_URL}/presence`, {
      autoConnect: false,
      transports: ['websocket'],
      secure: true,
      path: '/socket.io',
    })
  )
  const socketChatRef = useRef<Socket | null>(null)

  const fetchToken = async () => {
    try {
      const res = await fetch(SOCKET_TOKEN_URL)
      const data = await res.json()
      setAuthToken(data.token || null)
    } catch {
      console.error('Failed to fetch token')
    }
  }

  useEffect(() => {
    const pres = socketOnlineRef.current
    pres.on('onlineUsers', setOnlineUsers)
    pres.connect()
    return () => {
      pres.disconnect()
      pres.off('onlineUsers', setOnlineUsers)
    }
  }, [])

  useEffect(() => {
    fetchToken()
  }, [])

  useEffect(() => {
    if (!authToken) return
    const chat = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket'],
      secure: true,
      path: '/socket.io',
      auth: { token: authToken },
    })
    socketChatRef.current = chat

    chat.on('matched', ({ roomId: newRoomId }) => {
      setIsSearching(false)
      setIsConnected(true)
      setRoomId(newRoomId)
      setStrangerLeft(false)
      setMessages([
        {
          id: 'system-1',
          text: 'You are now chatting with a stranger. Say hi!',
          sender: 'system',
          timestamp: new Date(),
        },
      ])
      chat.emit('join room', newRoomId)
      setStatus('')
    })

    chat.on('chat message', ({ msg }) =>
      setMessages((m) => [
        ...m,
        { id: `str-${Date.now()}`, text: msg, sender: 'stranger', timestamp: new Date() },
      ])
    )

    chat.on('typing', ({ isTyping }) => setStrangerTyping(isTyping))

    chat.on('user disconnected', () => {
      setMessages((prev) => {
        if (prev.some((m) => m.text.includes('Stranger has disconnected'))) return prev
        return [
          ...prev,
          {
            id: `sysdisc-${Date.now()}`,
            text: 'Stranger has disconnected. Tap Exit to leave.',
            sender: 'system',
            timestamp: new Date(),
          },
        ]
      })
      setStrangerLeft(true)
      setStrangerTyping(false)
    })

    chat.on('connect_error', (err) => {
      console.error('Connection error:', err.message)
      setIsSearching(false)
      setStatus('Connection failed.')
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
    setStatus('Searching for a match...')
    setIsSearching(true)
    socketChatRef.current?.connect()
  }

  const leaveRoom = () => {
    const chat = socketChatRef.current
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (chat && roomId) {
      chat.emit('typing', { roomId, isTyping: false })
      chat.emit('leave room', { roomId })
    }
    if (chat?.connected) chat.disconnect()
    setIsConnected(false)
    setRoomId(null)
    setMessages([])
    setStrangerTyping(false)
    setStatus('Welcome!')
  }

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !roomId || strangerLeft) return
    setMessages((m) => [
      ...m,
      { id: `you-${Date.now()}`, text, sender: 'user', timestamp: new Date() },
    ])
    socketChatRef.current?.emit('chat message', { roomId, msg: text })
    socketChatRef.current?.emit('typing', { roomId, isTyping: false })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  const handleInputChange = (txt: string) => {
    if (!roomId) return

    socketChatRef.current?.emit('typing', { roomId, isTyping: true })

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    typingTimeoutRef.current = setTimeout(() => {
      socketChatRef.current?.emit('typing', { roomId, isTyping: false })
      typingTimeoutRef.current = null
    }, 1500)
  }

  const handleTouch = (e: any) => {
    /* no-op */
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
          <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate("Settings")}>
            <View style={styles.settingsIconContainer}>
              <Ionicons name="settings" size={20} color="#E5E7EB" />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <Header isConnected={isConnected} onlineUsers={onlineUsers} status={status} />
          <ChatWindow messages={messages} isTyping={strangerTyping} />
          <MessageInput
            onSendMessage={handleSendMessage}
            onDisconnect={leaveRoom}
            onChangeText={handleInputChange}
          />
        </View>
      )}
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  chatContainer: { flex: 1, backgroundColor: '#0A0A0F' },
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
