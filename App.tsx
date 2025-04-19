import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Header } from './src/components/Header';
import { ChatWindow } from './src/components/ChatWindow';
import { MessageInput } from './src/components/MessageInput';
import { FindButton } from './src/components/FindButton';
import { Message } from './types';

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Simulate finding a chat partner
  const handleFindChat = () => {
    setIsSearching(true);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsSearching(false);
      setIsConnected(true);
      
      // Add a system message
      setMessages([
        {
          id: '1',
          text: 'You are now chatting with a stranger. Say hi!',
          sender: 'system',
          timestamp: new Date(),
        },
      ]);
    }, 2000);
  };

  // Handle sending a message
  const handleSendMessage = (text: string) => {
    if (text.trim() === '') return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    
    // Simulate receiving a message after a short delay
    if (isConnected) {
      setTimeout(() => {
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'This is a simulated response from the stranger.',
          sender: 'stranger',
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, responseMessage]);
      }, 1500);
    }
  };

  // Disconnect from chat
  const handleDisconnect = () => {
    setIsConnected(false);
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