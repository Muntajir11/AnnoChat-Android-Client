import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Header } from '../components/Header';
import { ChatWindow } from '../components/ChatWindow';
import { MessageInput } from '../components/MessageInput';
import { useSignaling } from '../hooks/useSignaling';
import { usePeerChat } from '../hooks/usePeerChat';
import { filterText } from '../lib/filter';
import { getKeywordFilterEnabled } from '../lib/settings';
import { MAX_INPUT_CHARS, MAX_RELAY_TEXT } from '../lib/protocol';
import type { Message } from '../../types';

interface TextChatScreenProps {
  navigation: any;
  onMenuPress?: () => void;
  onChatStatusChange?: (isConnected: boolean) => void;
}

function connectionLabel(status: string) {
  if (status === 'ready') return 'Online';
  if (status === 'connecting') return 'Connecting…';
  if (status === 'reconnecting') return 'Reconnecting…';
  if (status === 'closed') return 'Offline';
  return 'Idle';
}

export const TextChatScreen: React.FC<TextChatScreenProps> = ({
  navigation,
  onMenuPress,
  onChatStatusChange,
}) => {
  const [filterOn, setFilterOn] = useState(true);
  const [reported, setReported] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signaling = useSignaling();
  const chat = usePeerChat({
    send: signaling.send,
    onFrame: signaling.onFrame,
    mode: 'text',
  });

  useEffect(() => {
    void getKeywordFilterEnabled().then(setFilterOn);
  }, []);

  useEffect(() => {
    void signaling.connect('text');
    return () => signaling.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- connect once per mount
  }, []);

  useEffect(() => {
    onChatStatusChange?.(chat.matched);
  }, [chat.matched, onChatStatusChange]);

  useEffect(() => {
    if (!chat.matched) setReported(false);
  }, [chat.matched]);

  const find = async () => {
    if (signaling.status !== 'ready') {
      await signaling.connect('text');
    }
    chat.find();
  };

  const skip = () => {
    chat.leave();
  };

  const messages: Message[] = chat.messages.map((m) => ({
    id: m.id,
    text: m.sender === 'stranger' ? filterText(m.text, filterOn) : m.text,
    sender: m.sender === 'you' ? 'user' : m.sender === 'system' ? 'system' : 'stranger',
    timestamp: new Date(),
  }));

  const status = chat.matched
    ? chat.connectFailed
      ? 'Couldn’t connect'
      : 'Matched'
    : chat.searching
      ? 'Searching'
      : chat.chatError || signaling.error || connectionLabel(signaling.status);

  const maxLen = chat.transport === 'relay' ? MAX_RELAY_TEXT : MAX_INPUT_CHARS;

  return (
    <View style={styles.container}>
      <Header
        isConnected={chat.matched}
        onlineUsers={signaling.online}
        status={status}
        onMenuPress={onMenuPress}
      />
      {chat.matched ? (
        <>
          <ChatWindow messages={messages} isTyping={chat.peerTyping} />
          {chat.connectFailed ? (
            <View style={styles.idle}>
              <Text style={styles.idleText}>Couldn’t connect — find someone else.</Text>
              <TouchableOpacity style={styles.cancel} onPress={skip}>
                <Text style={styles.cancelText}>Skip</Text>
              </TouchableOpacity>
            </View>
          ) : chat.transport === 'none' ? (
            <View style={styles.connectingRow}>
              <Text style={styles.idleText}>Connecting…</Text>
              <TouchableOpacity style={styles.cancel} onPress={skip}>
                <Text style={styles.cancelText}>Skip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.report}
                disabled={reported}
                onPress={() => {
                  chat.report('user');
                  setReported(true);
                }}
              >
                <Text style={styles.reportText}>{reported ? 'Reported' : 'Report'}</Text>
              </TouchableOpacity>
              <MessageInput
                maxLength={maxLen}
                onSendMessage={(text) => {
                  chat.sendTyping(false);
                  chat.sendMessage(text);
                }}
                onChangeText={(text) => {
                  chat.sendTyping(text.length > 0);
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => chat.sendTyping(false), 1500);
                }}
                onSkip={skip}
              />
            </>
          )}
        </>
      ) : (
        <View style={styles.idle}>
          {messages.length > 0 && (
            <View style={styles.history}>
              <ChatWindow messages={messages} isTyping={false} />
            </View>
          )}
          {chat.searching ? (
            <>
              <ActivityIndicator color="#10B981" size="large" />
              <Text style={styles.idleText}>Finding someone…</Text>
              <TouchableOpacity style={styles.cancel} onPress={() => chat.cancel()}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.idleText}>
                {chat.chatError ||
                  signaling.error ||
                  'Press Find to start a new chat. Matches do not restart on their own.'}
              </Text>
              <Text style={styles.meta}>
                {signaling.online} online (incl. you) · {connectionLabel(signaling.status)}
              </Text>
              {(signaling.status === 'closed' || signaling.status === 'reconnecting') && (
                <TouchableOpacity style={styles.find} onPress={() => void signaling.reconnect()}>
                  <Text style={styles.findText}>Reconnect</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.find}
                onPress={() => void find()}
                disabled={signaling.status === 'connecting' || signaling.status === 'reconnecting'}
              >
                <Text style={styles.findText}>
                  {signaling.status === 'connecting' ? 'Connecting…' : 'Find'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  idle: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  idleText: { color: '#CBD5E1', textAlign: 'center', fontSize: 16 },
  meta: { color: '#64748B', fontSize: 12, textAlign: 'center' },
  find: { backgroundColor: '#10B981', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24 },
  findText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancel: { backgroundColor: '#DC2626', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  cancelText: { color: '#fff', fontWeight: '600' },
  back: { padding: 8 },
  backText: { color: '#94A3B8' },
  report: { alignSelf: 'center', padding: 8 },
  reportText: { color: '#94A3B8', fontSize: 12 },
  connectingRow: { alignItems: 'center', gap: 12, padding: 16 },
  history: { maxHeight: 180, width: '100%', opacity: 0.7 },
});
