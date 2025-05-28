import type React from "react"
import { View, Text, StyleSheet } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

interface HeaderProps {
  isConnected: boolean
  onlineUsers: number
  status?: string
}

export const Header: React.FC<HeaderProps> = ({ isConnected, onlineUsers, status }) => {
  const getStatusInfo = () => {

     if (status === 'Connecting...') {
    return {
      text: 'Connecting…',
      icon: 'sync',
      color: '#3B82F6',
      pulse: true,
    }
  }


    if (status === "Searching for a match...") {
      return {
        text: "Searching...",
        icon: "search",
        color: "#F59E0B",
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
      color: "#6B7280",
      pulse: false,
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <View style={styles.header}>
      {/* Background effects */}
      <View style={styles.backgroundEffect1} />
      <View style={styles.backgroundEffect2} />

      <View style={styles.headerContent}>
        {/* Left side - App branding */}
        <View style={styles.leftContainer}>
          <View style={styles.brandContainer}>
            <View style={styles.logoContainer}>
              <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.appName}>ANNOCHAT</Text>
              <Text style={styles.tagline}>🌍 Connect • Chat • Discover</Text>
            </View>
          </View>
        </View>

        {/* Right side - Status and online users */}
        <View style={styles.rightContainer}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusRow, statusInfo.pulse && styles.pulseContainer]}>
              <Ionicons
                name={statusInfo.icon}
                size={16}
                color={statusInfo.color}
                style={statusInfo.pulse && styles.pulseIcon}
              />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
            </View>

            <View style={styles.onlineContainer}>
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>{onlineUsers} online</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#0A0A0F", // Match app background exactly
    borderWidth: 0,
    borderBottomWidth: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: "transparent",
    marginBottom: 0,
    marginTop: 0,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Background effects
  backgroundEffect1: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  backgroundEffect2: {
    position: "absolute",
    bottom: -15,
    left: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },

  leftContainer: {
    flex: 1,
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },

  brandText: {
    flex: 1,
  },

  appName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 1,
  },

  tagline: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  rightContainer: {
    alignItems: "flex-end",
  },

  statusContainer: {
    alignItems: "flex-end",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },

  pulseContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },

  pulseIcon: {
    opacity: 0.8,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    letterSpacing: 0.3,
  },

  onlineContainer: {
    marginTop: 6,
  },

  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },

  onlineText: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
})
