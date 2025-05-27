import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import { Header } from './Header'

const { width, height } = Dimensions.get('window')

interface Props {
  isSearching: boolean
  onPressFind: () => void
  status: string
  onlineUsers: number
  onTouch: (e: any) => void
}

export const AnimatedBackground: React.FC<Props> = ({
  isSearching,
  onPressFind,
  status,
  onlineUsers,
  onTouch,
}) => {
  // ripples
  const [touchRipples, setTouchRipples] = useState<
    Array<{ id: number; x: number; y: number; anim: Animated.Value }>
  >([])
  // chat bubbles float
  const floatAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ]
  // particles
  const particleX = useRef(
    Array.from({ length: 25 }, () => new Animated.Value(Math.random() * width))
  ).current
  const particleY = useRef(
    Array.from({ length: 25 }, () => new Animated.Value(Math.random() * height))
  ).current
  const particleOpacity = useRef(
    Array.from({ length: 25 }, () => new Animated.Value(Math.random() * 0.8 + 0.2))
  ).current
  const particleScale = useRef(
    Array.from({ length: 25 }, () => new Animated.Value(Math.random() * 0.5 + 0.5))
  ).current
  const particles = useRef(
    particleX.map((x, i) => ({
      x,
      y: particleY[i],
      opacity: particleOpacity[i],
      scale: particleScale[i],
    }))
  ).current
  // orbs
  const orbX = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(Math.random() * width))
  ).current
  const orbY = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(Math.random() * height))
  ).current
  const orbScale = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(1))
  ).current
  const orbOpacity = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0.3))
  ).current
  const orbs = useRef(
    orbX.map((x, i) => ({
      x,
      y: orbY[i],
      scale: orbScale[i],
      opacity: orbOpacity[i],
    }))
  ).current
  // planet
  const planetRotate = useRef(new Animated.Value(0)).current
  const planetPulse = useRef(new Animated.Value(1)).current
  // button
  const buttonPulse = useRef(new Animated.Value(1)).current

  // touch ripple handler
  const handleTouch = (e: any) => {
    onTouch(e)
    const { locationX: x, locationY: y } = e.nativeEvent
    const id = Date.now()
    const anim = new Animated.Value(0)
    setTouchRipples((prev) => [...prev, { id, x, y, anim }])
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() =>
      setTouchRipples((prev) => prev.filter((r) => r.id !== id))
    )
  }

  useEffect(() => {
    // floating chat bubbles
    floatAnims.forEach((anim, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + idx * 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000 + idx * 400,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start()
    })
    // particles
    particles.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(p.y, {
            toValue: Math.random() * height,
            duration: 8000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: Math.random() * height,
            duration: 8000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start()
      Animated.loop(
        Animated.sequence([
          Animated.timing(p.x, {
            toValue: Math.random() * width,
            duration: 10000 + Math.random() * 5000,
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: Math.random() * width,
            duration: 10000 + Math.random() * 5000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start()
      Animated.loop(
        Animated.sequence([
          Animated.timing(p.opacity, {
            toValue: Math.random() * 0.8 + 0.2,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: Math.random() * 0.8 + 0.2,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start()
    })
    // orbs
    orbs.forEach((o) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(o.x, {
            toValue: Math.random() * width,
            duration: 15000 + Math.random() * 10000,
            useNativeDriver: true,
          }),
          Animated.timing(o.x, {
            toValue: Math.random() * width,
            duration: 15000 + Math.random() * 10000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start()
      Animated.loop(
        Animated.sequence([
          Animated.timing(o.y, {
            toValue: Math.random() * height,
            duration: 12000 + Math.random() * 8000,
            useNativeDriver: true,
          }),
          Animated.timing(o.y, {
            toValue: Math.random() * height,
            duration: 12000 + Math.random() * 8000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start()
      Animated.loop(
        Animated.sequence([
          Animated.timing(o.scale, {
            toValue: 1.5,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(o.scale, {
            toValue: 1,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ).start()
    })
    // planet
    Animated.loop(
      Animated.timing(planetRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    ).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(planetPulse, {
          toValue: 1.1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(planetPulse, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start()
    // button
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    ).start()
  }, [])

  const planetSpin = planetRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <TouchableOpacity
      style={styles.welcomeContainer}
      activeOpacity={1}
      onPress={handleTouch}
    >
      {/* background */}
      <View style={styles.solidBackground} />
      <View style={styles.particleField}>
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                ],
                opacity: p.opacity,
                backgroundColor:
                  i % 4 === 0
                    ? '#8B5CF6'
                    : i % 4 === 1
                    ? '#3B82F6'
                    : i % 4 === 2
                    ? '#10B981'
                    : '#F59E0B',
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.rippleField}>
        {touchRipples.map((r) => (
          <Animated.View
            key={r.id}
            style={[
              styles.touchRipple,
              {
                left: r.x - 50,
                top: r.y - 50,
                transform: [
                  {
                    scale: r.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 3],
                    }),
                  },
                ],
                opacity: r.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 0],
                }),
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.orbField}>
        {orbs.map((o, i) => (
          <Animated.View
            key={i}
            style={[
              styles.orb,
              {
                backgroundColor:
                  ['rgba(139,92,246,0.1)',
                   'rgba(59,130,246,0.08)',
                   'rgba(16,185,129,0.06)',
                   'rgba(245,158,11,0.05)'][i % 4],
                transform: [
                  { translateX: o.x },
                  { translateY: o.y },
                  { scale: o.scale },
                ],
                opacity: o.opacity,
              },
            ]}
          />
        ))}
      </View>

      {/* header */}
      <View style={styles.headerContainer}>
        <Header
          isConnected={false}
          onlineUsers={onlineUsers}
          status={status}
        />
      </View>

      {/* hero bubbles */}
      {floatAnims.map((anim, i) => {
        const texts = ['Hi! 👋','Hello 🌍','Hey! 😊','🚀','💬']
        const stylesMap = [
          styles.chatBubble1,
          styles.chatBubble2,
          styles.chatBubble3,
          styles.chatBubble4,
          styles.chatBubble5,
        ]
        const rotation = ['-5deg','8deg','-3deg','12deg','-8deg'][i]
        const dy = [-10,-8,-12,-6,-9][i]
        return (
          <Animated.View
            key={i}
            style={[
              stylesMap[i],
              {
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0,1],
                      outputRange: [0,dy],
                    }),
                  },
                  { rotate: rotation },
                ],
              },
            ]}
          >
            <Text style={styles.bubbleText}>{texts[i]}</Text>
          </Animated.View>
        )
      })}

      {/* hero planet */}
      <View style={styles.heroSection}>
        <View style={styles.heroIcon}>
          <Animated.View
            style={[
              styles.planetContainer,
              {
                transform: [{ rotate: planetSpin }, { scale: planetPulse }],
              },
            ]}
          >
            <View style={styles.planetCore} />
            <View style={styles.planetRing1} />
            <View style={styles.planetRing2} />
            <Ionicons
              name="planet"
              size={48}
              color="#8B5CF6"
              style={styles.planetIcon}
            />
          </Animated.View>
        </View>
        <Text style={styles.heroTitle}>
          Connect{'\n'}
          <Text style={styles.heroTitleAccent}>Globally</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          ✨ Tap anywhere to create magic{'\n'}🚀 Where strangers become stories
        </Text>
      </View>

      {/* stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.statText}>100% Anonymous</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flash" size={20} color="#F59E0B" />
          <Text style={styles.statText}>Instant Match</Text>
        </View>
      </View>

      {/* action button */}
      <View style={styles.actionContainer}>
        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={onPressFind}
              disabled={isSearching}
            >
              <LinearGradient
                colors={
                  isSearching
                    ? ['#6366F1', '#8B5CF6']
                    : ['#8B5CF6', '#A855F7']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={isSearching ? 'search' : 'chatbubbles'}
                    size={24}
                    color="#FFF"
                  />
                  <Text style={styles.buttonText}>
                    {isSearching ? 'Searching...' : 'Start Chatting'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  welcomeContainer: { flex: 1, position: 'relative', overflow: 'hidden' },
  solidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0F',
  },
  particleField: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  rippleField: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    pointerEvents: 'none',
  },
  touchRipple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.6)',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  orbField: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  orb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#0A0A0F',
  },
  chatBubble1: { position: 'absolute', top: 150, left: 30, ...bubbleBase('#8B5CF6', 18) },
  chatBubble2: { position: 'absolute', top: 230, right: 40, ...bubbleBase('#10B981', 18) },
  chatBubble3: { position: 'absolute', bottom: 280, left: 50, ...bubbleBase('#F59E0B', 18) },
  chatBubble4: { position: 'absolute', top: 300, left: 20, ...bubbleBase('#3B82F6', 15) },
  chatBubble5: { position: 'absolute', bottom: 200, right: 30, ...bubbleBase('#8B5CF6', 15) },
  bubbleText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  heroSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 90, zIndex: 30 },
  heroIcon: { marginBottom: 32 },
  planetContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  planetCore: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(139,92,246,0.2)', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10 },
  planetRing1: { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  planetRing2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  planetIcon: { zIndex: 1 },
  heroTitle: { fontSize: 42, fontWeight: '800', color: '#FFF', textAlign: 'center', lineHeight: 48, marginBottom: 16, textShadowColor: 'rgba(139,92,246,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  heroTitleAccent: { color: '#8B5CF6' },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, marginBottom: 40, fontWeight: '500' },
  statsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingHorizontal: 32, marginBottom: 40, zIndex: 30 },
  statItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  statText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginLeft: 8, fontWeight: '600' },
  actionContainer: { paddingHorizontal: 32, paddingBottom: 40, zIndex: 30 },
  buttonContainer: { borderRadius: 28, backgroundColor: 'rgba(139,92,246,0.1)', padding: 2, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  mainButton: { borderRadius: 26, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 18, paddingHorizontal: 32 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 18, fontWeight: '700', color: '#FFF', marginLeft: 12, letterSpacing: 0.5 },
})

// helper for bubble style
function bubbleBase(color: string, radius: number) {
  return {
    backgroundColor: `rgba(${hexToRgb(color)},0.15)`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: `rgba(${hexToRgb(color)},0.3)`,
    zIndex: 20,
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
}
function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)!
  return `${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)}`
}
