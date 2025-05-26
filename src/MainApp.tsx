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
const SOCKET_TOKEN_URL = 'https://www.annochat.social/api/get-socket-token';

export const MainApp = ({ navigation }: any) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [strangerTyping, setStrangerTyping] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Welcome!');
  const [strangerLeft, setStrangerLeft] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketOnlineRef = useRef<Socket>(io(`${SERVER_URL}/presence`, {
    autoConnect: false, transports: ['websocket'], secure: true, path: '/socket.io',
  }));
  const socketChatRef = useRef<Socket | null>(null);

  // Emit typing events
  const handleTyping = (isTyping: boolean) => {
    if (!roomId || !isConnected) return;
    socketChatRef.current?.emit('typing', { roomId, isTyping });
  };

  // Fetch auth token
  const fetchToken = async () => {
    try {
      const res = await fetch(SOCKET_TOKEN_URL);
      const data = await res.json();
      setAuthToken(data.token || null);
    } catch {
      console.error('Failed to fetch token');
    }
  };

  // Presence socket
  useEffect(() => {
    const pres = socketOnlineRef.current;
    pres.on('onlineUsers', setOnlineUsers);
    pres.connect();
    return () => {
      pres.disconnect();
      pres.off('onlineUsers', setOnlineUsers);
    };
  }, []);

  // Chat socket
  useEffect(() => {
    fetchToken();
    if (!authToken) return;

    const chat = io(SERVER_URL, {
      autoConnect: false, transports: ['websocket'], secure: true, path: '/socket.io',
      auth: { token: authToken },
    });
    socketChatRef.current = chat;

    chat.on('matched', ({ roomId: newRoomId }) => {
      setIsSearching(false);
      setIsConnected(true);
      setRoomId(newRoomId);
      setStrangerLeft(false);            
      setMessages([{
        id: 'system-1',
        text: 'You are now chatting with a stranger. Say hi!',
        sender: 'system',
        timestamp: new Date(),
      }]);
      chat.emit('join room', newRoomId);
    });

    chat.on('chat message', ({ msg }) => {
      setMessages(m => [...m, {
        id: `str-${Date.now()}`, text: msg,
        sender: 'stranger', timestamp: new Date(),
      }]);
    });

    chat.on('typing', ({ isTyping }) => setStrangerTyping(isTyping));

    chat.on('user disconnected', () => {
      if (!strangerLeft) {
        setMessages(m => [...m, {
          id: `sysdisc-${Date.now()}`,
          text: 'Stranger has disconnected. Tap Exit to leave.',
          sender: 'system',
          timestamp: new Date(),
        }]);
        setStrangerLeft(true);
      }

      // leaveRoom();
      chat.disconnect();
      setStrangerTyping(false);

    });

    // chat.connect();
    return () => {
      chat.disconnect();
      chat.removeAllListeners();
    };
  }, [authToken]);

  const handleFindChat = () => {
    if (isConnected && roomId) leaveRoom();
    setRoomId(null);
    setMessages([]);
    setStatus('Searching for a match...');
    setIsSearching(true);
    socketChatRef.current?.connect();
  };

  const leaveRoom = () => {
    const chat = socketChatRef.current;
    if (chat && roomId) chat.emit('leave room', { roomId });
    if (chat && chat.connected) {
      chat.disconnect();
    }

    setIsConnected(false);
    setRoomId(null);
    setMessages([]);
    setStrangerTyping(false);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !roomId) return;
    setMessages(m => [...m, {
      id: `you-${Date.now()}`, text, sender: 'user', timestamp: new Date(),
    }]);
    socketChatRef.current?.emit('chat message', { roomId, msg: text });

    clearTimeout(typingTimeoutRef.current!);
    handleTyping(false);
    typingTimeoutRef.current = null;
  };

  const handleInputChange = (text: string) => {
    handleTyping(true);
    clearTimeout(typingTimeoutRef.current!);
    typingTimeoutRef.current = setTimeout(() => handleTyping(false), 1500);
  };

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
            <ChatWindow messages={messages} isTyping={strangerTyping} />
            <MessageInput
              onSendMessage={handleSendMessage}
              onDisconnect={leaveRoom}
              onChangeText={handleInputChange}
            />
          </>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16, backgroundColor: '#111' },
  welcomeContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24, backgroundColor: '#111',
  },
  welcomeText: {
    fontSize: 18, color: '#E0E0E0', textAlign: 'center',
    marginBottom: 40, lineHeight: 26,
  },
  settingsButton: {
    position: 'absolute', bottom: 4, left: 4, padding: 10,
    backgroundColor: '#1c1c1c', borderRadius: 100,
    shadowColor: '#000', shadowOpacity: 0.3,
    shadowRadius: 4, elevation: 5,
  },
});
