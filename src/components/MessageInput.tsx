import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onDisconnect: () => void;
  onChangeText: (text: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onDisconnect,
  onChangeText,
}) => {
  const [message, setMessage] = useState('');

  const handleChangeText = (text: string) => {
    setMessage(text);
    onChangeText(text); 
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed) {
      onSendMessage(trimmed);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.disconnectButton}
        onPress={onDisconnect}
        activeOpacity={0.7}
      >
        <Icon name="close-circle" size={28} color="#F44336" />
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={message}
          onChangeText={handleChangeText}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={true}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          !message.trim() && styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={!message.trim()}
        activeOpacity={0.7}
      >
        <Icon name="send" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
  },
  disconnectButton: {
    padding: 8,
    marginRight: 12,
    marginBottom: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: 'rgba(60, 60, 80, 0.8)', // Match the theme
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    marginRight: 12,
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 120,
    padding: 0,
    margin: 0,
    fontWeight: '400',
  },
  sendButton: {
    backgroundColor: '#6B46C1', // Purple to match theme
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(107, 70, 193, 0.4)',
    shadowOpacity: 0.1,
  },
});