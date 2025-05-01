import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';

interface HeaderProps {
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isConnected }) => {
  return (
    <LinearGradient
      colors={['#4A00E0', '#8E2DE2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <Text style={styles.appName}>AnnoChat 👻</Text>
      <View style={styles.statusContainer}>
        <View 
          style={[
            styles.statusIndicator, 
            isConnected ? styles.connected : styles.disconnected
          ]} 
        />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  appName: {
    fontSize: 22,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: '#000',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});