import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface HeaderProps {
  isConnected: boolean
  onlineUsers: number
  status?: string
  onMenuPress?: () => void
}

export const Header: React.FC<HeaderProps> = ({ isConnected, onlineUsers, status, onMenuPress }) => {
  const insets = useSafeAreaInsets()

  const openWebsite = () => {
    Linking.openURL("https://annochat.social").catch((err) => {
      console.error("Failed to open URL:", err)
    })
  }

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.brandContainer} onPress={openWebsite} activeOpacity={0.8}>
          <View style={styles.logoWrapper}>
            <View style={styles.logo}>
              <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.logoGlow} />
          </View>
          <View style={styles.brandText}>
            <Text style={styles.appName}>ANNOCHAT</Text>
            <Text style={styles.tagline}>Connect • Discover • Chat</Text>
          </View>
        </TouchableOpacity>

        {onMenuPress && (
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress} activeOpacity={0.8}>
            <View style={styles.menuIcon}>
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "rgba(10, 10, 15, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.1)",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 50,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoWrapper: {
    position: "relative",
    marginRight: 16,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  logoGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 26,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    zIndex: 1,
  },
  brandText: {
    alignItems: "flex-start",
  },
  appName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: -2,
  },
  tagline: {
    fontSize: 11,
    color: "#8B5CF6",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  menuIcon: {
    alignItems: "center",
    gap: 3,
  },
  menuDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#8B5CF6",
  },
})
