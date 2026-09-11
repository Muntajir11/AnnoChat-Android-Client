import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RTCView, mediaDevices, MediaStream } from 'react-native-webrtc';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignaling } from '../../hooks/useSignaling';
import { usePeerChat } from '../../hooks/usePeerChat';
import { useAudioManager } from '../../utils/useAudioManager';
import { useCallTiming } from './useCallTiming';
import { CallControls } from './CallControls';
import { CallStatus } from './CallStatus';
import { LocalVideoDraggable } from './LocalVideoDraggable';
import { requestCameraAndMicrophonePermissions } from '../../utils/permissions';
import { SETTINGS_KEYS, getDefaultCamera, type CameraFacing } from '../../lib/settings';

interface VideoChatScreenProps {
  navigation?: any;
  onMenuPress?: () => void;
  onChatStatusChange?: (isConnected: boolean) => void;
  shouldAutoConnect?: boolean;
  shouldDisconnectOnTabSwitch?: boolean;
}

export const VideoChatScreen: React.FC<VideoChatScreenProps> = ({
  onMenuPress,
  onChatStatusChange,
}) => {
  const [ageOk, setAgeOk] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<CameraFacing>('user');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [reported, setReported] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const audio = useAudioManager();
  const signaling = useSignaling();
  const chat = usePeerChat({
    send: signaling.send,
    onFrame: signaling.onFrame,
    mode: 'video',
    localStream,
    onRemoteStream: (s) => setRemoteStream(s),
  });
  const elapsed = useCallTiming(chat.matched);

  useEffect(() => {
    void AsyncStorage.getItem(SETTINGS_KEYS.age).then((v) => setAgeOk(v === '1'));
    void getDefaultCamera().then(setFacing);
  }, []);

  useEffect(() => {
    if (!ageOk) return;
    void signaling.connect('video');
    return () => signaling.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- connect once after age gate
  }, [ageOk]);

  useEffect(() => {
    onChatStatusChange?.(chat.matched);
    if (!chat.matched) {
      setRemoteStream(null);
      setReported(false);
    }
  }, [chat.matched, onChatStatusChange]);

  async function getMedia(nextFacing: CameraFacing) {
    const attempts = [
      { audio: true, video: { facingMode: nextFacing } },
      { audio: true, video: true },
      { audio: true, video: false },
    ];
    let last: unknown;
    for (const constraints of attempts) {
      try {
        return (await mediaDevices.getUserMedia(constraints)) as unknown as MediaStream;
      } catch (err) {
        last = err;
      }
    }
    throw last instanceof Error ? last : new Error('Could not access camera or microphone');
  }

  async function startCamera() {
    const ok = await requestCameraAndMicrophonePermissions();
    if (!ok) {
      setMediaError('Camera or microphone permission was denied.');
      return null;
    }
    await audio.setupAudioForVideoCall();
    try {
      const stream = await getMedia(facing);
      setLocalStream(stream);
      setMediaError(null);
      return stream;
    } catch (err) {
      setMediaError(err instanceof Error ? err.message : 'Could not start camera');
      return null;
    }
  }

  async function acceptAge() {
    await AsyncStorage.setItem(SETTINGS_KEYS.age, '1');
    setAgeOk(true);
  }

  function stopStream() {
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    void audio.restoreAudioSettings();
  }

  if (!ageOk) {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateTitle}>You must be 18+</Text>
        <Text style={styles.gateBody}>Video chat is only for adults. Confirm you are 18 or older.</Text>
        <TouchableOpacity style={styles.find} onPress={() => void acceptAge()}>
          <Text style={styles.findText}>I am 18 or older</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menu}>
          <Ionicons name="menu" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Video Chat</Text>
        <Text style={styles.online}>{signaling.online} online (incl. you)</Text>
      </View>
      {(signaling.status === 'closed' || signaling.status === 'reconnecting') && (
        <TouchableOpacity onPress={() => void signaling.reconnect()} style={styles.menu}>
          <Text style={styles.online}>Reconnect</Text>
        </TouchableOpacity>
      )}
      <View style={styles.stage}>
        {remoteStream ? (
          <RTCView streamURL={remoteStream.toURL()} style={styles.remote} objectFit="cover" />
        ) : (
          <CallStatus
            searching={chat.searching}
            matched={chat.matched}
            error={mediaError || signaling.error}
            elapsed={elapsed}
          />
        )}
        <LocalVideoDraggable stream={localStream} />
      </View>
      <CallControls
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        showLeave={chat.matched}
        onToggleMic={() => {
          localStream?.getAudioTracks().forEach((t) => {
            t.enabled = !t.enabled;
          });
          setIsMicOn((v) => !v);
        }}
        onToggleCam={() => {
          localStream?.getVideoTracks().forEach((t) => {
            t.enabled = !t.enabled;
          });
          setIsCamOn((v) => !v);
        }}
        onFlip={async () => {
          const next = facing === 'user' ? 'environment' : 'user';
          try {
            const stream = await getMedia(next);
            const video = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];
            if (video) await chat.replaceTrack(video);
            if (audioTrack) await chat.replaceTrack(audioTrack);
            localStream?.getTracks().forEach((t) => t.stop());
            setFacing(next);
            setLocalStream(stream);
            setMediaError(null);
          } catch (err) {
            setMediaError(err instanceof Error ? err.message : 'Could not switch camera');
          }
        }}
        onLeave={() => {
          stopStream();
          chat.leave();
        }}
        onFind={async () => {
          const stream = localStream || (await startCamera());
          if (!stream) return;
          if (signaling.status !== 'ready') await signaling.connect('video');
          chat.find();
        }}
        onCancel={() => chat.cancel()}
        onReport={() => {
          if (reported) return;
          chat.report('user');
          setReported(true);
        }}
        searching={chat.searching}
        matched={chat.matched}
        ready={signaling.status === 'ready'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    gap: 12,
  },
  menu: { padding: 8 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  online: { color: '#94A3B8', fontSize: 12 },
  stage: { flex: 1, backgroundColor: '#000' },
  remote: { flex: 1 },
  gate: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', padding: 24, gap: 16 },
  gateTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  gateBody: { color: '#94A3B8', fontSize: 16 },
  find: { backgroundColor: '#fff', padding: 14, borderRadius: 12, alignItems: 'center' },
  findText: { color: '#000', fontWeight: '700' },
});
