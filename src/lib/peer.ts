import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import type { RTCDataChannel, MediaStreamTrack } from 'react-native-webrtc';
import { config } from '../config/config';
import { createCandidateBuffer } from './iceBuffer';

type Pc = RTCPeerConnection & {
  connectionState?: string;
  iceConnectionState?: string;
  getSenders?: () => { track?: { kind: string } | null; replaceTrack: (t: MediaStreamTrack | null) => Promise<void> }[];
};

export type PeerHandlers = {
  onSignal: (kind: 'offer' | 'answer' | 'ice', payload: unknown) => void;
  onChannelOpen: () => void;
  onChannelMessage: (data: unknown) => void;
  onChannelClosed: () => void;
  onConnectionFailed?: () => void;
  onRemoteStream?: (stream: MediaStream) => void;
};

export function createPeer(ice: { urls: string }[], isCaller: boolean, h: PeerHandlers) {
  const pc = new RTCPeerConnection({
    iceServers: ice,
    bundlePolicy: 'max-bundle',
    iceTransportPolicy: config.iceTransportPolicy,
  }) as Pc;
  let channel: RTCDataChannel | null = null;
  const iceBuf = createCandidateBuffer<unknown>();
  let failed = false;

  const fail = () => {
    if (failed) return;
    failed = true;
    h.onConnectionFailed?.();
  };

  const wire = (ch: RTCDataChannel) => {
    channel = ch;
    (ch as unknown as { onopen: () => void }).onopen = () => h.onChannelOpen();
    (ch as unknown as { onclose: () => void }).onclose = () => h.onChannelClosed();
    (ch as unknown as { onmessage: (e: MessageEvent) => void }).onmessage = (e) => {
      try {
        h.onChannelMessage(JSON.parse(String(e.data)));
      } catch {
        /* ignore */
      }
    };
  };

  if (isCaller) {
    wire(pc.createDataChannel('chat') as RTCDataChannel);
  } else {
    (pc as unknown as { ondatachannel: (e: { channel: RTCDataChannel }) => void }).ondatachannel = (e) =>
      wire(e.channel);
  }

  (pc as unknown as { onicecandidate: (e: { candidate: unknown }) => void }).onicecandidate = (e) => {
    if (e.candidate) h.onSignal('ice', e.candidate);
  };
  (pc as unknown as { ontrack: (e: { streams: MediaStream[] }) => void }).ontrack = (e) => {
    if (e.streams?.[0]) h.onRemoteStream?.(e.streams[0]);
  };
  (pc as unknown as { onconnectionstatechange: () => void }).onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') fail();
  };
  (pc as unknown as { oniceconnectionstatechange: () => void }).oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'failed') fail();
  };

  const addIce = async (payload: unknown) => {
    await pc.addIceCandidate(new RTCIceCandidate(payload as never));
  };

  return {
    pc,
    send: (obj: unknown) => {
      if (!channel || (channel as unknown as { readyState: string }).readyState !== 'open') return false;
      (channel as unknown as { send: (s: string) => void }).send(JSON.stringify(obj));
      return true;
    },
    async createOffer() {
      const offer = await pc.createOffer({} as never);
      await pc.setLocalDescription(offer);
      h.onSignal('offer', offer);
    },
    async accept(kind: 'offer' | 'answer' | 'ice', payload: unknown) {
      if (kind === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload as never));
        await iceBuf.markRemoteReady(addIce);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        h.onSignal('answer', answer);
      } else if (kind === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload as never));
        await iceBuf.markRemoteReady(addIce);
      } else {
        await iceBuf.add(payload, addIce);
      }
    },
    addStream(stream: MediaStream) {
      stream.getTracks().forEach((track) => {
        const sender = pc.getSenders?.().find((s) => s.track?.kind === track.kind);
        if (sender) void sender.replaceTrack(track as MediaStreamTrack);
        else pc.addTrack(track, stream);
      });
    },
    async replaceTrack(track: MediaStreamTrack) {
      const sender = pc.getSenders?.().find((s) => s.track?.kind === track.kind);
      if (sender) await sender.replaceTrack(track);
      else pc.addTrack(track);
    },
    close() {
      try {
        channel?.close();
      } catch {
        /* ignore */
      }
      pc.close();
    },
    mediaDevices,
  };
}

export type PeerHandle = ReturnType<typeof createPeer>;
