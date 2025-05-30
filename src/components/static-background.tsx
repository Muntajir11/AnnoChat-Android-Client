"use client"

import type React from "react"
import { View, StyleSheet, Dimensions } from "react-native"

const { width, height } = Dimensions.get("window")

interface StaticBackgroundProps {
  variant?: "welcome" | "privacy" | "matching" | "community" | "terms"
}

const StaticBackground: React.FC<StaticBackgroundProps> = ({ variant = "welcome" }) => {
  // Solid colors for each variant - no gradients to avoid boxed look
  const getBackgroundColor = () => {
    switch (variant) {
      case "welcome":
        return "#1a1a2e"
      case "privacy":
        return "#2d1b69"
      case "matching":
        return "#7c2d12"
      case "community":
        return "#134e4a"
      case "terms":
        return "#581c87"
      default:
        return "#1a1a2e"
    }
  }

  // Floating elements for visual interest
  const getFloatingElements = () => {
    switch (variant) {
      case "welcome":
        return [
          { color: "#8b5cf6", size: 100, top: 80, left: width - 120, opacity: 0.3 },
          { color: "#06b6d4", size: 60, top: 200, left: 30, opacity: 0.4 },
          { color: "#f59e0b", size: 40, top: 350, left: width - 80, opacity: 0.5 },
          { color: "#8b5cf6", size: 80, top: 500, left: 50, opacity: 0.3 },
          { color: "#06b6d4", size: 120, top: 650, left: width - 150, opacity: 0.2 },
        ]
      case "privacy":
        return [
          { color: "#a855f7", size: 90, top: 100, left: width - 110, opacity: 0.4 },
          { color: "#3b82f6", size: 70, top: 250, left: 40, opacity: 0.3 },
          { color: "#8b5cf6", size: 50, top: 400, left: width - 90, opacity: 0.5 },
          { color: "#6366f1", size: 110, top: 550, left: 60, opacity: 0.3 },
        ]
      case "matching":
        return [
          { color: "#ef4444", size: 85, top: 120, left: width - 100, opacity: 0.4 },
          { color: "#f97316", size: 65, top: 280, left: 35, opacity: 0.5 },
          { color: "#dc2626", size: 45, top: 420, left: width - 85, opacity: 0.6 },
          { color: "#ea580c", size: 95, top: 580, left: 55, opacity: 0.3 },
        ]
      case "community":
        return [
          { color: "#10b981", size: 95, top: 90, left: width - 115, opacity: 0.4 },
          { color: "#06b6d4", size: 75, top: 240, left: 45, opacity: 0.5 },
          { color: "#059669", size: 55, top: 380, left: width - 95, opacity: 0.6 },
          { color: "#0891b2", size: 105, top: 520, left: 65, opacity: 0.3 },
        ]
      case "terms":
        return [
          { color: "#7c3aed", size: 88, top: 110, left: width - 108, opacity: 0.4 },
          { color: "#8b5cf6", size: 68, top: 260, left: 42, opacity: 0.5 },
          { color: "#6d28d9", size: 48, top: 410, left: width - 88, opacity: 0.6 },
          { color: "#7c3aed", size: 98, top: 560, left: 58, opacity: 0.3 },
        ]
      default:
        return []
    }
  }

  const backgroundColor = getBackgroundColor()
  const elements = getFloatingElements()

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Floating decorative elements */}
      {elements.map((element, index) => (
        <View
          key={index}
          style={[
            styles.floatingElement,
            {
              backgroundColor: element.color,
              width: element.size,
              height: element.size,
              top: element.top,
              left: element.left,
              opacity: element.opacity,
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: width,
    height: height,
    zIndex: -1,
  },
  floatingElement: {
    position: "absolute",
    borderRadius: 1000,
  },
})

export default StaticBackground
