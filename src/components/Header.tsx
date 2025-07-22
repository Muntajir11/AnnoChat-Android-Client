import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  isConnected: boolean
  onlineUsers: number
  status?: string
  onMenuPress?: () => void
}

export const Header: React.FC<HeaderProps> = ({ isConnected, onlineUsers, status, onMenuPress }) => {
  const insets = useSafeAreaInsets();
  
  const openWebsite = () => {
    Linking.openURL('https://annochat.social').catch(err => {
      console.error('Failed to open URL:', err);
    });
  };

  const getStatusInfo = () => {

  if (status === 'Connecting...') {
    return {
      text: 'Connecting…',
      icon: 'sync',
      color: '#6EE7B7',
      pulse: true,
    }
  }


    if (status === "Searching for a match...") {
      return {
        text: "Searching...",
        icon: "search",
        color: "#6EE7B7",
        pulse: true,
      }
    }
    if (isConnected) {
      return {
        text: "Connected",
        icon: "checkmark-circle",
        color: "#10B981",
        pulse: false,
      }
    }
    return {
      text: "Ready",
      icon: "radio-button-off",
      color: "#34D399",
      pulse: false,
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.headerContent}>
        {/* Left side - App branding */}
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.iconContainer}
            onPress={openWebsite}
            activeOpacity={0.7}>
            <Ionicons name="chatbubbles" size={20} color="#10B981" />
          </TouchableOpacity>
          <View style={styles.textContainer}>
            <Text style={styles.appTitle}>ANNOCHAT</Text>
            <Text style={styles.appSubtitle}>Anonymous Chat</Text>
          </View>
        </View>

        {/* Right side - Menu only */}
        <View style={styles.rightSection}>
          {onMenuPress && (
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={onMenuPress}
              activeOpacity={0.7}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0A0A0F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 211, 153, 0.2)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },

  textContainer: {
    alignItems: 'flex-start',
  },

  appTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: 0.3,
  },

  appSubtitle: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '500',
    marginTop: -1,
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  statusSection: {
    alignItems: 'flex-end',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  onlineText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },

  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 0.5,
  },
})
