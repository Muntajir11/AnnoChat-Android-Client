import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import io from 'socket.io-client';
import SendIcon from 'react-native-vector-icons/Ionicons';
import CrossIcon from 'react-native-vector-icons/Entypo';


const socket = io('http://10.0.2.2:5000');

interface Message {
  text: string;
  sentByUser: boolean;
}

const ChatComponent = () => {
  const [message, setMessage] = useState<string>(''); 
  const [heading, setHeading] = useState<string>('Waiting for a Stranger...');
  const [messages, setMessages] = useState<Message[]>([]); 
  const [roomId, setRoomId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    socket.on('matched', ({ roomId}) => {
      setRoomId(roomId);
      setHeading(`Chatting with a stranger!`);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `Matched with a Stranger. Say Hii!`, sentByUser: false },
      ]);
    });

    socket.on('chat message', (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `${data.msg}`, sentByUser: false },
      ]);
    });

    socket.on('user disconnected', (userId) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `Stranger has disconnected.`, sentByUser: false },
      ]);
      setHeading('Stranger has disconnected.');
    });

    return () => {
      socket.disconnect(); 
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() && roomId) {
      socket.emit('chat message', { msg: message, roomId });
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `${message}`, sentByUser: true },
      ]);
      setMessage('');
    }
  };
  

  const exitChat = () => {
    if (roomId) {
      socket.disconnect(); 
      socket.connect();
      setRoomId(null);
      setMessages([]);
      setHeading('Waiting for a Stranger...');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{heading}</Text>
      </View>

      <ScrollView
        style={styles.chatWindow}
        ref={scrollViewRef}
        contentContainerStyle={styles.chatContent}>
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              msg.sentByUser ? styles.sentMessage : styles.receivedMessage,
            ]}>
            <Text
              style={[
                styles.messageText,
                msg.sentByUser
                  ? styles.sentMessageText
                  : styles.receivedMessageText,
              ]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message"
      />
      <View style={styles.buttonContainer}>
        <Pressable
        onPress={sendMessage}
        hitSlop={20}
        >
        <SendIcon name="send-sharp" size={36} color="#0B2F9F" />
        </Pressable>  

        <Pressable onPress={exitChat}>
        <CrossIcon name="circle-with-cross" size={36} color="#0B2F9F"/>
        </Pressable>

      </View>
    </View>

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  chatWindow: {
    flex: 1,
  },
  chatContent: {
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },

  header: {
    height: 60,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161D6F',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5E5',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#000',
  },
  receivedMessageText: {
    color: '#000',
  },
  inputContainer: {
    
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'center',
  },
  textInput: {
    flexDirection: 'row',
    flexGrow: 3,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
    paddingLeft: 10,
    maxWidth: '70%',
    minWidth: '70%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '30%',
  },
});

export default ChatComponent;
