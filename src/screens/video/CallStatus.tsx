import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function CallStatus({
  searching,
  matched,
  error,
  elapsed,
}: {
  searching: boolean;
  matched: boolean;
  error: string | null;
  elapsed: number;
}) {
  const [label, setLabel] = useState('Ready');
  useEffect(() => {
    if (error) setLabel(error);
    else if (searching) setLabel('Finding your match');
    else if (matched) setLabel(`Connected · ${elapsed}s`);
    else setLabel('Press Find to start');
  }, [searching, matched, error, elapsed]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#CBD5E1', fontSize: 16 },
});
