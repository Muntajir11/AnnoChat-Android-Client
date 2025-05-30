"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { StyleSheet, Animated, type TextStyle } from "react-native"

interface AnimatedTextProps {
  text: string
  style?: TextStyle
  delay?: number
  duration?: number
  animation?: "fadeIn" | "slideUp" | "slideLeft" | "scale" | "none"
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  style,
  delay = 0,
  duration = 500,
  animation = "fadeIn",
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration,
      delay: delay,
      useNativeDriver: true,
    }).start()
  }, [animatedValue, delay, duration])

  const getAnimationStyle = () => {
    switch (animation) {
      case "fadeIn":
        return {
          opacity: animatedValue,
        }
      case "slideUp":
        return {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }
      case "slideLeft":
        return {
          opacity: animatedValue,
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }
      case "scale":
        return {
          opacity: animatedValue,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        }
      case "none":
        return {}
      default:
        return {
          opacity: animatedValue,
        }
    }
  }

  return <Animated.Text style={[styles.text, style, getAnimationStyle()]}>{text}</Animated.Text>
}

const styles = StyleSheet.create({
  text: {
    color: "#FFFFFF",
  },
})

export default AnimatedText
