import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatWindow } from '../components/ChatWindow';
import { MessageInput } from '../components/MessageInput';
import { Header } from '../components/Header';
import type { Message } from '../../types';
// import { BackHandler, Alert } from "react-native";

interface ChatScreenProps {
  messages: Message[];
  isTyping: boolean;
  onlineUsers: number;
  status: string;
  onMenuPress?: () => void;
  onSendMessage: (text: string) => void;
  onDisconnect: () => void;
  onChangeText: (text: string) => void;
}



export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  isTyping,
  onlineUsers,
  status,
  onMenuPress,
  onSendMessage,
  onDisconnect,
  onChangeText,
}) => {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);


  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);
  
  return (
    <View style={styles.container}>
      <Header
        isConnected={true}
        onlineUsers={onlineUsers}
        status={status}
        onMenuPress={onMenuPress}
      />
      <KeyboardAvoidingView 
        style={styles.chatContent}
        behavior={Platform.OS === 'ios' ? 'padding' : isKeyboardVisible ? 'height' : undefined}
        keyboardVerticalOffset={0}
      >
        <ChatWindow messages={messages} isTyping={isTyping} />
        <View style={styles.inputContainer}>
          <MessageInput
            onSendMessage={onSendMessage}
            onDisconnect={onDisconnect}
            onChangeText={onChangeText}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  chatContent: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: '#0A0A0F',
    paddingBottom: 10,
  },
});