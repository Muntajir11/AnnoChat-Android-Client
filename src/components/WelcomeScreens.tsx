import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const screens = [
  'Welcome to the AnnoChat! Chat anonymously with strangers.',
  'Tap "Find" to start looking for a stranger to chat with.',
  'Chats are private, and no one knows your identity.',
  'Be respectful and have fun chatting!',
];

const WelcomeScreens = ({ onDone }: { onDone: () => void }) => {
  const [index, setIndex] = useState(0);

  const nextScreen = () => {
    if (index < screens.length - 1) {
      setIndex(index + 1);
    } else {
      onDone();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{screens[index]}</Text>
      <TouchableOpacity style={styles.button} onPress={nextScreen}>
        <Text style={styles.buttonText}>{index === screens.length - 1 ? 'Start' : 'Next'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    color: '#ffffff',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default WelcomeScreens;
