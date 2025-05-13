import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const SettingsScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <TouchableOpacity 
        style={styles.option}
        onPress={() => navigation.navigate('SupportFeedback')}
      >
        <Text style={styles.text}>Support & Feedback</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.option}
        onPress={() => navigation.navigate('About')}
      >
        <Text style={styles.text}>About</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20 },
  header: { fontSize: 26, color: '#fff', marginBottom: 30, fontWeight: 'bold' },
  option: {
    paddingVertical: 15,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  text: { fontSize: 18, color: '#ccc' },
  backButton: {
    marginTop: 40,
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  backText: { color: '#aaa', fontSize: 16, textAlign: 'center' },
});