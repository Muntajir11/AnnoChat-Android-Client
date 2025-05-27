import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface HeaderProps {
  isConnected: boolean;
  onlineUsers: number;
  status?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  onlineUsers,
  status,
}) => {
  return (
    <LinearGradient
      colors={['#4A00E0', '#8E2DE2']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={styles.header}>
      <View style={styles.leftContainer}>
        <Text style={styles.appName}>AnnoChat</Text>
          {status ? (
            <Text style={styles.secondaryStatusText}>{status}</Text>
          ) : null}
      </View>

      <View style={styles.rightContainer}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusIndicator,
              isConnected ? styles.connected : styles.disconnected,
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>

        
        </View>

        <View style={styles.onlineContainer}>
          
          <Text style={styles.onlineText}>{onlineUsers} online</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineContainer: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  appName: {
    fontSize: 20,
    letterSpacing: 1,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontFamily: 'curve',
    letterSpacing: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  onlineText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: 'curve',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  secondaryStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontStyle: 'italic',
    marginTop: 2,
    fontFamily: 'curve',
  },
});
