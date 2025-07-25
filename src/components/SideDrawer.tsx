"use client"

import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions, StatusBar } from "react-native"
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
        toValue: screenWidth * 0.25, // Show drawer taking 75% width
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

  if (!isVisible) return null

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* Drawer */}
        <Animated.View style={[styles.drawer, { left: slideAnim }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#F1F5F9" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Settings */}
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateToScreen("Settings")}>
              <Ionicons name="settings-outline" size={24} color="#10B981" />
              <Text style={styles.menuText}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#6EE7B7" />
            </TouchableOpacity>

            {/* About */}
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateToScreen("About")}>
              <Ionicons name="information-circle-outline" size={24} color="#10B981" />
              <Text style={styles.menuText}>About</Text>
              <Ionicons name="chevron-forward" size={20} color="#6EE7B7" />
            </TouchableOpacity>

            {/* Support & Feedback */}
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateToScreen("SupportFeedback")}>
              <Ionicons name="help-circle-outline" size={24} color="#10B981" />
              <Text style={styles.menuText}>Support and Feedback</Text>
              <Ionicons name="chevron-forward" size={20} color="#6EE7B7" />
            </TouchableOpacity>

            {/* Additional Options */}
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="shield-outline" size={24} color="#10B981" />
              <Text style={styles.menuText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#6EE7B7" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="document-text-outline" size={24} color="#10B981" />
              <Text style={styles.menuText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color="#6EE7B7" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "75%",
    backgroundColor: "#0F172A",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(52, 211, 153, 0.2)",
    paddingTop: StatusBar.currentHeight || 44,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(52, 211, 153, 0.2)",
    backgroundColor: "#0F172A",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 16,
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.1)",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#F1F5F9",
    marginLeft: 16,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    marginVertical: 16,
    marginHorizontal: 20,
  },
})
