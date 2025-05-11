import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import io, { Socket } from 'socket.io-client';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { FindButton } from './components/FindButton';
import { Message } from '../types';

const SERVER_URL = 'http://10.0.2.2:5000';

export const MainApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);

  const socketOnlineRef = useRef<Socket>(io(`${SERVER_URL}/presence`, { autoConnect: false }));
  const socketChatRef = useRef<Socket>(io(SERVER_URL, { autoConnect: false }));

  useEffect(() => {
    const presenceSocket = socketOnlineRef.current;
    if (!presenceSocket.connected) presenceSocket.connect();
    presenceSocket.on('onlineUsers', setOnlineUsers);
    return () => {
      presenceSocket.off('onlineUsers', setOnlineUsers);
      presenceSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const chatSocket = socketChatRef.current;

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
    });

    chatSocket.on('chat message', ({ msg }) => {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          text: msg,
          sender: 'stranger',
          timestamp: new Date(),
        },
      ]);
    });

    chatSocket.on('user disconnected', () => {
      setMessages(prev => [
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
      chatSocket.off('matched');
      chatSocket.off('chat message');
      chatSocket.off('user disconnected');
    };
  }, []);

  const handleFindChat = () => {
    const chatSocket = socketChatRef.current;
    if (!chatSocket.connected) chatSocket.connect();
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
    setMessages(prev => [...prev, newMessage]);
    socketChatRef.current.emit('chat message', { roomId, msg: text });
  };

  const handleDisconnect = () => {
    const chatSocket = socketChatRef.current;
    if (chatSocket.connected && roomId) {
      chatSocket.emit('leave_room', { roomId });
      chatSocket.disconnect();
    }
    setIsConnected(false);
    setIsSearching(false);
    setRoomId(null);
    setMessages([]);
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
          </View>
        ) : (
          <>
            <ChatWindow messages={messages} />
            <MessageInput onSendMessage={handleSendMessage} onDisconnect={handleDisconnect} />
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
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 18,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
});
