import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ChatModeSelectionScreenProps {
  navigation: any;
}

export const ChatModeSelectionScreen: React.FC<ChatModeSelectionScreenProps> = ({
  navigation,
}) => {
  const handleTextChat = () => {
    navigation.navigate('TextChat');
  };

  const handleVideoChat = () => {
    navigation.navigate('VideoChat');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Chat Mode</Text>
          <Text style={styles.subtitle}>How would you like to connect?</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleTextChat}
            activeOpacity={0.8}>
            <Ionicons name="chatbubble-ellipses" size={32} color="#8B5CF6" />
            <Text style={styles.buttonText}>Text Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleVideoChat}
            activeOpacity={0.8}>
            <Ionicons name="videocam" size={32} color="#8B5CF6" />
            <Text style={styles.buttonText}>Video Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064E3B',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 20,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
