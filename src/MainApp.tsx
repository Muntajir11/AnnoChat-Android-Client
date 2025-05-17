import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import io, { Socket } from 'socket.io-client';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { FindButton } from './components/FindButton';
import { Message } from '../types';

const SERVER_URL = 'https://muntajir.me';

export const MainApp = ({ navigation }: any) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);

  // —————— SOCKETS ——————

  // Presence namespace, forced to websocket transport
  const socketOnlineRef = useRef<Socket>(
    io(`${SERVER_URL}/presence`, {
      autoConnect: false,
      transports: ['websocket'],
      secure: true,
      path: '/socket.io',
    })
  );

  // Root namespace for matchmaking & chat
  const socketChatRef = useRef<Socket>(
    io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket'],
      secure: true,
      path: '/socket.io',
    })
  );

  // — Presence socket logic — 
  useEffect(() => {
    const presenceSocket = socketOnlineRef.current;

    // Register handlers before connecting
    presenceSocket.on('connect_error', (err) => {
      console.log('[Presence Socket] Connection Error:', err.message);
    });
    presenceSocket.on('onlineUsers', (count: number) => {
      setOnlineUsers(count);
    });

    // Now connect
    presenceSocket.connect();

    return () => {
      presenceSocket.disconnect();
    };
  }, []);

  // — Chat socket logic —
  useEffect(() => {
    const chatSocket = socketChatRef.current;

    // Matched: join flow
    chatSocket.on('matched', ({ roomId: newRoomId }) => {
      setIsSearching(false);
      setIsConnected(true);
      setRoomId(newRoomId);
      setMessages([
        {
          id: 'system-1',
          text: 'You are now chatting with a stranger. Say hi!',
          sender: 'system',
          timestamp: new Date(),
        },
      ]);

      // Tell server to add us to the room
      chatSocket.emit('join room', newRoomId);
    });

    // Incoming messages
    chatSocket.on('chat message', ({ msg }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          text: msg,
          sender: 'stranger',
          timestamp: new Date(),
        },
      ]);
    });

    // Partner disconnected
    chatSocket.on('user disconnected', () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `sysdisc-${Date.now()}`,
          text: 'Stranger has disconnected. Tap Exit to leave.',
          sender: 'system',
          timestamp: new Date(),
        },
      ]);
    });


    return () => {
      chatSocket.disconnect();
    };
  }, []);

  // — Handlers for UI buttons —

  const handleFindChat = () => {
    const chatSocket = socketChatRef.current;
    if (!chatSocket.connected) {
      chatSocket.connect();
    }
    setIsSearching(true);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !roomId) return;
    const newMessage: Message = {
      id: `you-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    socketChatRef.current.emit('chat message', { roomId, msg: text });
  };

  const handleDisconnect = () => {
    const chatSocket = socketChatRef.current;
    if (chatSocket.connected) {
      chatSocket.disconnect();
    }
    setIsConnected(false);
    setIsSearching(false);
    setRoomId(null);
    setMessages([]);
  };

  // — UI Rendering —

  return (
    <>
      <Header isConnected={isConnected} onlineUsers={onlineUsers} />
      <View style={styles.content}>
        {!isConnected ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Chat anonymously with strangers from around the world
            </Text>
            <FindButton onPress={handleFindChat} isSearching={isSearching} />
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={28} color="#888" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ChatWindow messages={messages} />
            <MessageInput
              onSendMessage={handleSendMessage}
              onDisconnect={handleDisconnect}
            />
          </>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#111',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#111',
  },
  welcomeText: {
    fontSize: 18,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  settingsButton: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    padding: 10,
    backgroundColor: '#1c1c1c',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
