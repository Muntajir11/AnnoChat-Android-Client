"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { View, StyleSheet, Animated } from "react-native"

interface AnimatedIconProps {
  children: React.ReactNode
  delay?: number
}

const AnimatedIcon: React.FC<AnimatedIconProps> = ({ children, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Initial animation
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    // Continuous floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [scaleAnim, rotateAnim, opacityAnim, delay])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "0deg"],
  })

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { rotate },
            {
              translateY: scaleAnim.interpolate({
                inputRange: [0.95, 1.05],
                outputRange: [5, -5],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.iconWrapper}>{children}</View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
})

export default AnimatedIcon
