"use client"

import type React from "react"
import { createContext, useContext, useState, useRef } from "react"
import type { Message } from "../../types"

interface ChatContextType {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isTyping: boolean
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
  onlineUsers: number
  setOnlineUsers: React.Dispatch<React.SetStateAction<number>>
  status: string
  setStatus: React.Dispatch<React.SetStateAction<string>>
  roomId: string | null
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>
  chatWsRef: React.MutableRefObject<WebSocket | null>
  onSendMessage: (text: string) => void
  onDisconnect: () => void
  onChangeText: (text: string) => void
  setOnSendMessage: (fn: (text: string) => void) => void
  setOnDisconnect: (fn: () => void) => void
  setOnChangeText: (fn: (text: string) => void) => void
  disconnectWithAutoSearch: () => void
  disconnectWithoutAutoSearch: () => void
  setDisconnectWithAutoSearch: (fn: () => void) => void
  setDisconnectWithoutAutoSearch: (fn: () => void) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [status, setStatus] = useState("Connecting...")
  const [roomId, setRoomId] = useState<string | null>(null)
  const chatWsRef = useRef<WebSocket | null>(null)

  // Function handlers
  const [onSendMessage, setOnSendMessage] = useState<(text: string) => void>(() => () => {})
  const [onDisconnect, setOnDisconnect] = useState<() => void>(() => () => {})
  const [onChangeText, setOnChangeText] = useState<(text: string) => void>(() => () => {})

  const [disconnectWithAutoSearch, setDisconnectWithAutoSearch] = useState<() => void>(() => () => {})
  const [disconnectWithoutAutoSearch, setDisconnectWithoutAutoSearch] = useState<() => void>(() => () => {})

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        isTyping,
        setIsTyping,
        onlineUsers,
        setOnlineUsers,
        status,
        setStatus,
        roomId,
        setRoomId,
        chatWsRef,
        onSendMessage,
        onDisconnect,
        onChangeText,
        setOnSendMessage,
        setOnDisconnect,
        setOnChangeText,
        disconnectWithAutoSearch,
        disconnectWithoutAutoSearch,
        setDisconnectWithAutoSearch,
        setDisconnectWithoutAutoSearch,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider")
  }
  return context
}
