import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { ChatWindow } from '../components/ChatWindow';
import { MessageInput } from '../components/MessageInput';
import { Header } from '../components/Header';
import { useChatContext } from '../contexts/ChatContext';
import type { Message } from '../../types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import analytics from '@react-native-firebase/analytics';

const SERVER_URL = 'https://muntajir.me';
const SOCKET_TOKEN_URL = 'https://annochat.social/api/get-socket-token';

interface TextChatScreenProps {
  navigation: any;
  onMenuPress?: () => void;
  onChatStatusChange?: (isConnected: boolean) => void;
}

export const TextChatScreen: React.FC<TextChatScreenProps> = ({ navigation, onMenuPress, onChatStatusChange }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [strangerLeft, setStrangerLeft] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceWsRef = useRef<WebSocket | null>(null);
  const presenceConnectingRef = useRef(false);

  // Use ChatContext instead of local state
  const {
    messages,
    setMessages,
    isTyping: strangerTyping,
    setIsTyping: setStrangerTyping,
    onlineUsers,
    setOnlineUsers,
    status,
    setStatus,
    roomId,
    setRoomId,
    chatWsRef,
    setOnSendMessage,
    setOnDisconnect,
    setOnChangeText,
  } = useChatContext();

  const [isConnected, setIsConnected] = useState(false);

  const fetchToken = async () => {
    try {
      const res = await fetch(SOCKET_TOKEN_URL);
      const data = await res.json();
      setAuthToken(data.token || null);
    } catch {
      console.error('Failed to fetch token');
    }
  };

  useEffect(() => {
    const connectPresence = () => {
      if (
        presenceConnectingRef.current ||
        (presenceWsRef.current &&
          (presenceWsRef.current.readyState === WebSocket.CONNECTING ||
            presenceWsRef.current.readyState === WebSocket.OPEN))
      ) {
        return;
      }
      presenceConnectingRef.current = true;
      const presenceWs = new WebSocket(
        `${SERVER_URL.replace('http://', 'ws://').replace(
          'https://',
          'wss://'
        )}/presence`
      );
      presenceWsRef.current = presenceWs;

      presenceWs.onopen = () => {
        presenceConnectingRef.current = false;
        setStatus('Ready');
      };

      presenceWs.onmessage = e => {
        const { event, data } = JSON.parse(e.data);
        if (event === 'onlineUsers') {
          setOnlineUsers(data);
        }
      };

      presenceWs.onerror = error => {
        presenceConnectingRef.current = false;
      };

      presenceWs.onclose = event => {
        presenceConnectingRef.current = false;

        if (event.code !== 1000 && presenceWsRef.current === presenceWs) {
          setTimeout(() => {
            if (
              presenceWsRef.current === presenceWs ||
              !presenceWsRef.current
            ) {
              connectPresence();
            }
          }, 3000);
        }
      };
    };

    connectPresence();

    return () => {
      if (presenceWsRef.current) {
        presenceWsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    fetchToken();
  }, []);

  useEffect(() => {
    if (!authToken) return;

    return () => {
      if (chatWsRef.current && chatWsRef.current.close) {
        chatWsRef.current.close();
      }
    };
  }, [authToken]);

  // Update context with function handlers
  useEffect(() => {
    setOnSendMessage(() => (text: string) => {
      if (!text.trim() || !roomId || strangerLeft) return;
      setMessages(m => [
        ...m,
        {
          id: `you-${Date.now()}`,
          text,
          sender: 'user',
          timestamp: new Date(),
        },
      ]);

      const chat = chatWsRef.current;
      if (chat && chat.readyState === WebSocket.OPEN) {
        chat.send(
          JSON.stringify({ event: 'chat message', data: { roomId, msg: text } })
        );
        chat.send(
          JSON.stringify({
            event: 'typing',
            data: { roomId, isTyping: false },
          })
        );
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    });
    
    setOnDisconnect(() => () => {
      leaveRoom();
      navigation.goBack();
    });
    
    setOnChangeText(() => (txt: string) => {
      if (!roomId) return;

      const chat = chatWsRef.current;
      if (chat && chat.readyState === WebSocket.OPEN) {
        chat.send(
          JSON.stringify({ event: 'typing', data: { roomId, isTyping: true } })
        );
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        if (chat && chat.readyState === WebSocket.OPEN) {
          chat.send(
            JSON.stringify({
              event: 'typing',
              data: { roomId, isTyping: false },
            })
          );
        }
        typingTimeoutRef.current = null;
      }, 1500);
    });
  }, [roomId, strangerLeft, setMessages, setOnSendMessage, setOnDisconnect, setOnChangeText]);

  // Navigate to separate Chat screen when connected
  useEffect(() => {
    if (isConnected) {
      navigation.navigate('Chat');
    }
  }, [isConnected]);

  const connectChat = () => {
    if (chatWsRef.current) {
      chatWsRef.current.close();
      chatWsRef.current = null;
    }
    const chatUrl = `${SERVER_URL.replace('http://', 'ws://').replace(
      'https://',
      'wss://'
    )}/?token=${authToken}`;
    const chatWs = new WebSocket(chatUrl);
    chatWsRef.current = chatWs;

    chatWs.onopen = () => {};

    chatWs.onmessage = e => {
      const { event, data } = JSON.parse(e.data);

      switch (event) {
        case 'matched':
          setIsSearching(false);
          setIsConnected(true);
          setRoomId(data.roomId);
          setStrangerLeft(false);
          setMessages([
            {
              id: 'system-1',
              text: 'You are now chatting with a stranger.\nSay hi!',
              sender: 'system',
              timestamp: new Date(),
            },
          ]);

          chatWs.send(
            JSON.stringify({ event: 'join room', data: data.roomId })
          );
          break;

        case 'chat message':
          if (data.senderId !== 'self') {
            setMessages(m => [
              ...m,
              {
                id: `str-${Date.now()}`,
                text: data.msg,
                sender: 'stranger',
                timestamp: new Date(),
              },
            ]);
          }
          break;

        case 'typing':
          if (data.senderId !== 'self') {
            setStrangerTyping(data.isTyping);
          }
          break;

        case 'user disconnected':
          setMessages(prev => {
            if (prev.some(m => m.text.includes('Stranger has disconnected')))
              return prev;
            return [
              ...prev,
              {
                id: `sysdisc-${Date.now()}`,
                text: 'Stranger has disconnected. Tap Exit to leave.',
                sender: 'system',
                timestamp: new Date(),
              },
            ];
          });
          setStrangerLeft(true);
          setStrangerTyping(false);
          break;

        case 'error':
          if (data && data.message === 'Auth failed') {
            setStatus('Authentication failed. Please try again.');
            chatWs.close();
            setIsConnected(false);
            setIsSearching(false);
          } else {
            setStatus(`Error: ${data.message || 'Unknown error'}`);
          }
          break;
      }
    };

    chatWs.onerror = error => {
      setIsSearching(false);
      setStatus('Connection failed.');
    };

    chatWs.onclose = event => {
      if (chatWsRef.current === chatWs) {
        chatWsRef.current = null;
      }
    };
  };

  const handleFindChat = () => {
    if (isButtonDisabled || status !== 'Ready') return;
    
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 1500); // 1.5 second delay
    
    analytics().logEvent('search_started');

    if (isConnected && roomId) leaveRoom();
    setRoomId(null);
    setMessages([]);

    if (authToken) {
      connectChat();
      setIsSearching(true);
      setStatus('Searching for a match...');
    } else {
      console.log('Auth token not available yet. Cannot connect to chat.');
    }
  };

  const handleCancelSearch = () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 1000); // 1 second delay
    
    if (chatWsRef.current) {
      chatWsRef.current.close();
      chatWsRef.current = null;
    }
    setIsSearching(false);
    setStatus('Ready');
  };

  const leaveRoom = () => {
    const chat = chatWsRef.current;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (chat && chat.readyState === WebSocket.OPEN && roomId) {
      chat.send(
        JSON.stringify({
          event: 'typing',
          data: { roomId, isTyping: false },
        })
      );
      chat.send(JSON.stringify({ event: 'leave room', data: roomId }));
    }
    if (chat) {
      chat.close();
    }
    setIsConnected(false);
    setRoomId(null);
    setMessages([]);
    setStrangerTyping(false);
    setStatus('Ready');
  };

  const handleTouch = (e: any) => {};

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Header
          isConnected={isConnected}
          onlineUsers={onlineUsers}
          status={status}
          onMenuPress={onMenuPress}
        />
        
        <View style={styles.searchContent}>
            <View style={styles.heroSection}>
            {isSearching ? (
              <View style={styles.searchingContainer}>
                <View style={styles.searchingIcon}>
                  <ActivityIndicator size="large" color="#10B981" />
                  <View style={styles.searchingDots}>
                    <View style={styles.searchDot} />
                    <View style={styles.searchDot} />
                    <View style={styles.searchDot} />
                  </View>
                </View>
                <Text style={styles.searchingTitle}>Discovering Someone New</Text>
                <Text style={styles.searchingSubtitle}>Connecting you with an interesting stranger...</Text>
                
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.statusText}>{status}</Text>
                  <Text style={styles.onlineCount}>{onlineUsers} online</Text>
                </View>
              </View>
            ) : (
              <View style={styles.welcomeContainer}>
                <View style={styles.heroIcon}>
                  <Ionicons name="globe-outline" size={50} color="#10B981" />
                </View>
                <Text style={styles.heroTitle}>Connect Worldwide</Text>
                <Text style={styles.heroSubtitle}>Meet strangers, share stories, discover new perspectives from around the globe</Text>
                
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: status === 'Ready' ? '#10B981' : '#F59E0B' }]} />
                  <Text style={styles.statusText}>{status}</Text>
                  <Text style={styles.onlineCount}>{onlineUsers} online</Text>
                </View>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.searchButton,
              isSearching && !isButtonDisabled && styles.searchingButton,
              (isButtonDisabled || (status !== 'Ready' && !isSearching)) && styles.disabledButton,
            ]}
            onPress={isSearching ? handleCancelSearch : handleFindChat}
            disabled={isButtonDisabled || (status !== 'Ready' && !isSearching)}>
            <Text style={[
              styles.searchButtonText,
              (isButtonDisabled || (status !== 'Ready' && !isSearching)) && styles.disabledButtonText
            ]}>
              {isSearching ? 'Cancel Search' : status !== 'Ready' ? 'Connecting...' : 'Start Chatting'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  searchContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  searchingContainer: {
    alignItems: 'center',
  },
  searchingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    position: 'relative',
  },
  searchingDots: {
    position: 'absolute',
    bottom: -15,
    flexDirection: 'row',
    gap: 4,
  },
  searchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    opacity: 0.7,
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 8,
    textAlign: 'center',
  },
  searchingSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: '400',
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
    fontWeight: '400',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#F1F5F9',
    fontWeight: '600',
    marginRight: 12,
  },
  onlineCount: {
    fontSize: 14,
    color: '#6EE7B7',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 24,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  searchingButton: {
    backgroundColor: '#DC2626',
    borderColor: 'rgba(220, 38, 38, 0.4)',
    shadowColor: '#000000',
  },
  disabledButton: {
    backgroundColor: '#334155',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
});
