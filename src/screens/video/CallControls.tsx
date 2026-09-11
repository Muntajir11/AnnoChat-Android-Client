import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function CallControls({
  isMicOn,
  isCamOn,
  showLeave,
  onToggleMic,
  onToggleCam,
  onFlip,
  onLeave,
  onFind,
  onCancel,
  onReport,
  searching,
  matched,
  ready,
}: {
  isMicOn: boolean;
  isCamOn: boolean;
  showLeave: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onFlip: () => void;
  onLeave: () => void;
  onFind: () => void;
  onCancel: () => void;
  onReport: () => void;
  searching: boolean;
  matched: boolean;
  ready: boolean;
}) {
  return (
    <View style={styles.row}>
      {!matched && !searching && (
        <TouchableOpacity style={styles.find} onPress={onFind} disabled={!ready}>
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.label}>Find</Text>
        </TouchableOpacity>
      )}
      {searching && (
        <TouchableOpacity style={styles.cancel} onPress={onCancel}>
          <Text style={styles.label}>Cancel</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.btn} onPress={onToggleMic}>
        <Ionicons name={isMicOn ? 'mic' : 'mic-off'} size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onToggleCam}>
        <Ionicons name={isCamOn ? 'videocam' : 'videocam-off'} size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={onFlip}>
        <Ionicons name="camera-reverse" size={20} color="#fff" />
      </TouchableOpacity>
      {matched && (
        <TouchableOpacity style={styles.btn} onPress={onReport}>
          <Ionicons name="flag" size={18} color="#fff" />
        </TouchableOpacity>
      )}
      {showLeave && (
        <TouchableOpacity style={styles.leave} onPress={onLeave}>
          <Ionicons name="call" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 16, alignItems: 'center' },
  btn: { backgroundColor: '#1E293B', padding: 12, borderRadius: 12 },
  leave: { backgroundColor: '#DC2626', padding: 12, borderRadius: 12 },
  find: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cancel: { backgroundColor: '#DC2626', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  label: { color: '#fff', fontWeight: '600' },
});
