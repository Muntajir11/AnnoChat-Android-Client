"use client"

import type React from "react"
import { View, StyleSheet, Dimensions } from "react-native"
import { LinearGradient } from "react-native-linear-gradient"

const { width, height } = Dimensions.get("window")

interface StaticBackgroundProps {
  variant?: "welcome" | "privacy" | "matching" | "community" | "terms"
}

const StaticBackground: React.FC<StaticBackgroundProps> = ({ variant = "welcome" }) => {
  // Colors matching your app's theme
  const getTheme = () => {
    switch (variant) {
      case "welcome":
        return {
          background: ["#1a1a2e", "#16213e", "#0f3460"],
          bubbles: [
            { color: "#8b5cf6", size: 120, top: "15%", left: "80%" },
            { color: "#06b6d4", size: 80, top: "25%", left: "10%" },
            { color: "#374151", size: 100, top: "60%", left: "75%" },
            { color: "#4c1d95", size: 60, top: "70%", left: "20%" },
            { color: "#065f46", size: 90, top: "40%", left: "85%" },
          ],
        }
      case "privacy":
        return {
          background: ["#1a1a2e", "#16213e", "#0f3460"],
          bubbles: [
            { color: "#8b5cf6", size: 110, top: "20%", left: "75%" },
            { color: "#374151", size: 85, top: "30%", left: "15%" },
            { color: "#4c1d95", size: 95, top: "65%", left: "80%" },
            { color: "#065f46", size: 70, top: "75%", left: "25%" },
            { color: "#06b6d4", size: 55, top: "45%", left: "5%" },
          ],
        }
      case "matching":
        return {
          background: ["#1a1a2e", "#16213e", "#0f3460"],
          bubbles: [
            { color: "#8b5cf6", size: 100, top: "18%", left: "70%" },
            { color: "#374151", size: 90, top: "35%", left: "20%" },
            { color: "#4c1d95", size: 75, top: "55%", left: "85%" },
            { color: "#06b6d4", size: 85, top: "70%", left: "15%" },
            { color: "#065f46", size: 65, top: "80%", left: "75%" },
          ],
        }
      case "community":
        return {
          background: ["#1a1a2e", "#16213e", "#0f3460"],
          bubbles: [
            { color: "#06b6d4", size: 115, top: "22%", left: "78%" },
            { color: "#8b5cf6", size: 80, top: "28%", left: "12%" },
            { color: "#374151", size: 105, top: "58%", left: "82%" },
            { color: "#065f46", size: 70, top: "72%", left: "18%" },
            { color: "#4c1d95", size: 60, top: "42%", left: "8%" },
          ],
        }
      case "terms":
        return {
          background: ["#1a1a2e", "#16213e", "#0f3460"],
          bubbles: [
            { color: "#8b5cf6", size: 95, top: "25%", left: "72%" },
            { color: "#4c1d95", size: 85, top: "32%", left: "18%" },
            { color: "#374151", size: 75, top: "62%", left: "78%" },
            { color: "#065f46", size: 90, top: "75%", left: "22%" },
            { color: "#06b6d4", size: 65, top: "48%", left: "12%" },
          ],
        }
      default:
        return {
          background: ["#1a1a2e", "#16213e", "#0f3460"],
          bubbles: [
            { color: "#8b5cf6", size: 120, top: "15%", left: "80%" },
            { color: "#06b6d4", size: 80, top: "25%", left: "10%" },
            { color: "#374151", size: 100, top: "60%", left: "75%" },
            { color: "#4c1d95", size: 60, top: "70%", left: "20%" },
            { color: "#065f46", size: 90, top: "40%", left: "85%" },
          ],
        }
    }
  }

  const theme = getTheme()

  return (
    <View style={styles.container}>
      {/* Base gradient background matching your app */}
      <LinearGradient colors={theme.background} style={styles.background} />

      {/* Static floating bubbles */}
      {theme.bubbles.map((bubble, index) => (
        <View
          key={index}
          style={[
            styles.bubble,
            {
              backgroundColor: bubble.color,
              width: bubble.size,
              height: bubble.size,
              top: bubble.top,
              left: bubble.left,
              opacity: 0.6,
            },
          ]}
        />
      ))}

      {/* Small dots scattered around */}
      <View style={[styles.dot, { top: "35%", left: "45%", backgroundColor: "#fbbf24" }]} />
      <View style={[styles.dot, { top: "55%", left: "35%", backgroundColor: "#f59e0b" }]} />
      <View style={[styles.dot, { top: "25%", left: "55%", backgroundColor: "#fbbf24" }]} />
      <View style={[styles.dot, { top: "75%", left: "65%", backgroundColor: "#f59e0b" }]} />
      <View style={[styles.dot, { top: "45%", left: "25%", backgroundColor: "#fbbf24" }]} />
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
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  bubble: {
    position: "absolute",
    borderRadius: 1000,
  },
  dot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
})

export default StaticBackground
