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
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onDisconnect,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      Keyboard.dismiss();
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
          placeholderTextColor="#888888"
          value={message}
          onChangeText={setMessage}
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
    alignItems: 'center',
    paddingVertical: 0,
  },
  disconnectButton: {
    padding: 4,
    marginRight: 4,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 14,
    marginRight: 8,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    padding: 0,
  },
  sendButton: {
    backgroundColor: '#4A00E0',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  sendButtonDisabled: {
    backgroundColor: '#555555',
  },
});