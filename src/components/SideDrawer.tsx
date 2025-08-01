"use client"
import React from "react"
import { View, Text, StyleSheet, TouchableHighlight, Modal, Animated, Dimensions, StatusBar, Linking } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

interface SideDrawerProps {
  isVisible: boolean
  onClose: () => void
  navigation: any
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

export const SideDrawer: React.FC<SideDrawerProps> = ({ isVisible, onClose, navigation }) => {
  const slideAnim = React.useRef(new Animated.Value(screenWidth)).current

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: screenWidth * 0.25,
        duration: 300,
        useNativeDriver: false,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: false,
      }).start()
    }
  }, [isVisible])

  const navigateToScreen = (screenName: string) => {
    onClose()
    navigation.navigate(screenName)
  }

  const handleExternalLink = (url: string) => {
    onClose()
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err))
  }

  if (!isVisible) return null

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <View style={styles.overlay}>
        <TouchableHighlight style={styles.backdrop} activeOpacity={1} onPress={onClose} underlayColor="transparent">
          <View style={{ flex: 1 }} />
        </TouchableHighlight>
        
        <Animated.View style={[styles.drawer, { left: slideAnim }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <TouchableHighlight onPress={onClose} style={styles.closeButton} activeOpacity={0.7} underlayColor="rgba(255, 255, 255, 0.1)">
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableHighlight>
          </View>
          
          <View style={styles.content}>
            {/* Settings */}
            <TouchableHighlight 
              style={styles.menuItem} 
              onPress={() => navigateToScreen("Settings")} 
              activeOpacity={0.8}
              underlayColor="rgba(255, 255, 255, 0.08)"
            >
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="settings-outline" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.menuText}>Settings</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableHighlight>

            {/* About */}
            <TouchableHighlight 
              style={styles.menuItem} 
              onPress={() => navigateToScreen("About")} 
              activeOpacity={0.8}
              underlayColor="rgba(255, 255, 255, 0.08)"
            >
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="information-circle-outline" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.menuText}>About</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableHighlight>

            {/* Support & Feedback */}
            <TouchableHighlight 
              style={styles.menuItem} 
              onPress={() => navigateToScreen("SupportFeedback")} 
              activeOpacity={0.8}
              underlayColor="rgba(255, 255, 255, 0.08)"
            >
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="help-circle-outline" size={20} color="#FF6B6B" />
                </View>
                <Text style={styles.menuText}>Support and Feedback</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableHighlight>

            {/* Privacy Policy */}
            <TouchableHighlight 
              style={styles.menuItem} 
              onPress={() => handleExternalLink("https://annochat.social")} 
              activeOpacity={0.8}
              underlayColor="rgba(255, 255, 255, 0.08)"
            >
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="shield-outline" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.menuText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableHighlight>

            {/* Terms of Service */}
            <TouchableHighlight 
              style={styles.menuItem} 
              onPress={() => handleExternalLink("https://annochat.social")} 
              activeOpacity={0.8}
              underlayColor="rgba(255, 255, 255, 0.08)"
            >
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.menuText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableHighlight>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 15, 0.75)",
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "75%",
    backgroundColor: "#0A0A0F",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(76, 175, 80, 0.2)",
    paddingTop: StatusBar.currentHeight || 44,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#0A0A0F",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  content: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  menuItem: {
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    overflow: 'hidden',
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "transparent",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
})