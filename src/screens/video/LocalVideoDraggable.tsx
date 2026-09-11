import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet } from 'react-native';
import { RTCView, MediaStream } from 'react-native-webrtc';

export function LocalVideoDraggable({ stream }: { stream: MediaStream | null }) {
  const pos = useRef(new Animated.ValueXY({ x: 16, y: 16 })).current;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
      onPanResponderGrant: () => {
        pos.setOffset({ x: (pos.x as any)._value, y: (pos.y as any)._value });
        pos.setValue({ x: 0, y: 0 });
      },
      onPanResponderRelease: () => pos.flattenOffset(),
    }),
  ).current;

  if (!stream) return null;

  return (
    <Animated.View style={[styles.pip, { transform: pos.getTranslateTransform() }]} {...pan.panHandlers}>
      <RTCView streamURL={stream.toURL()} style={styles.video} objectFit="cover" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pip: {
    position: 'absolute',
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    right: 16,
    bottom: 16,
  },
  video: { flex: 1 },
});
