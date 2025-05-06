import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { Header } from './src/components/Header';
import { ChatWindow } from './src/components/ChatWindow';
import { MessageInput } from './src/components/MessageInput';
import { FindButton } from './src/components/FindButton';
import { Message } from './types';

const SERVER_URL = 'http://10.0.2.2:5000';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);


  const socketRef = useRef<Socket>(
    io(SERVER_URL, { autoConnect: false })
  );


  const handleFindChat = () => {
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
    setIsSearching(true);
  };

  useEffect(() => {
    const socket = socketRef.current;


    socket.on('matched', ({ roomId: newRoomId, partnerId }) => {
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

 
    socket.on('chat message', ({ msg, senderId }) => {
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

    
    socket.on('user disconnected', () => {
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
      socket.off('matched');
      socket.off('chat message');
      socket.off('user disconnected');
    };
  }, []);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !roomId) return;


    const newMessage: Message = {
      id: `you-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);


    socketRef.current.emit('chat message', {
      roomId,
      msg: text,
    });
  };

  const handleDisconnect = () => {
    if (socketRef.current.connected && roomId) {
      socketRef.current.emit('leave_room', { roomId });
      socketRef.current.disconnect();
    }
    setIsConnected(false);
    setIsSearching(false);
    setRoomId(null);
    setMessages([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <Header isConnected={isConnected} />

      <View style={styles.content}>
        {!isConnected ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Chat anonymously with strangers from around the world
            </Text>
            <FindButton
              onPress={handleFindChat}
              isSearching={isSearching}
            />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
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

export default App;
