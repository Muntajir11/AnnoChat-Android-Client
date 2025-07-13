"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from "react-native"
import { PanGestureHandler, State, GestureHandlerRootView } from "react-native-gesture-handler"
import { Svg, Path, Circle } from "react-native-svg"
import StaticBackground from "./static-background"

const { width, height } = Dimensions.get("window")

// Sexy Chat Icon
const SexyMessageIcon = ({ size = 80, color = "#34D399" }) => (
  <View style={[styles.iconCircle, { backgroundColor: color, width: size, height: size }]}>
    <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <Path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white" />
      <Circle cx="8" cy="10" r="1.5" fill={color} />
      <Circle cx="12" cy="10" r="1.5" fill={color} />
      <Circle cx="16" cy="10" r="1.5" fill={color} />
    </Svg>
  </View>
)

// Mystery Mask Icon
const MysteryIcon = ({ size = 80, color = "#34D399" }) => (
  <View style={[styles.iconCircle, { backgroundColor: color, width: size, height: size }]}>
    <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill="white"
      />
      <Path d="M8 11h2v2H8zm6 0h2v2h-2z" fill={color} />
    </Svg>
  </View>
)

// Fire Icon for Hot Connections
const FireIcon = ({ size = 80, color = "#10B981" }) => (
  <View style={[styles.iconCircle, { backgroundColor: color, width: size, height: size }]}>
    <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"
        fill="white"
      />
    </Svg>
  </View>
)

// Heart Planet Icon
const HeartPlanetIcon = ({ size = 80, color = "#10b981" }) => (
  <View style={[styles.iconCircle, { backgroundColor: color, width: size, height: size }]}>
    <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill="white"
      />
    </Svg>
  </View>
)

// Custom Back Arrow Icon
const BackArrowIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19L5 12L12 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

const slides = [
  {
    title: "Ready to\nMeet Someone?",
    subtitle: "Anonymous • Exciting • Real",
    description: "Dive into conversations that spark curiosity\nNo names, just pure connection",
    icon: <SexyMessageIcon />,
    variant: "welcome",
  },
  {
    title: "Stay\nMysterious",
    subtitle: "Your Secret is Safe",
    description: "Be whoever you want to be tonight\nYour identity, your choice, your adventure",
    icon: <MysteryIcon />,
    variant: "privacy",
  },
  {
    title: "Instant\nSpark",
    subtitle: "Hot Connections Await",
    description: "Feel the thrill of meeting someone new\nEvery conversation is a new adventure",
    icon: <FireIcon />,
    variant: "matching",
  },
  {
    title: "Love Knows\nNo Borders",
    subtitle: "Global Hearts Unite",
    description: "Connect with souls from every corner of Earth\nDistance means nothing when hearts align",
    icon: <HeartPlanetIcon />,
    variant: "community",
  },
]

// Separate Terms Screen Component
type TermsScreenProps = {
  onAccept: () => void
  onBack: () => void
}

const TermsScreen = ({ onAccept, onBack }: TermsScreenProps) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const scrollViewRef = useRef(null)

  // Function to handle checkbox toggle
  const handleCheckboxToggle = () => {
    if (hasScrolledToBottom) {
      setAccepted(!accepted)
    }
  }

  return (
    <View style={styles.termsScreenContainer}>
      <StaticBackground variant="terms" />

      <View style={styles.termsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <BackArrowIcon />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.termsTitle}>Terms & Privacy</Text>
          <Text style={styles.termsSubtitle}>Let's keep it safe and fun for everyone:</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.termsScrollView}
        contentContainerStyle={styles.termsScrollContent}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const offsetY = e.nativeEvent.contentOffset.y
          const contentHeight = e.nativeEvent.contentSize.height
          const layoutHeight = e.nativeEvent.layoutMeasurement.height

          if (!accepted && offsetY + layoutHeight >= contentHeight - 50) {
            setHasScrolledToBottom(true)
          }
        }}
      >
        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>🎭 Stay Anonymous, Stay Safe</Text>
          <Text style={styles.termsText}>
            • Your real identity stays hidden - always{"\n"}• No personal data stored on our servers{"\n"}•
            Conversations vanish when you're done{"\n"}• Jump in without signing up - it's that easy
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>💖 Respect & Good Vibes</Text>
          <Text style={styles.termsText}>
            • Treat everyone with kindness and respect{"\n"}• Keep it clean - no harassment or hate{"\n"}• Must be 18+
            to join the fun{"\n"}• Report anything that feels wrong{"\n"}• Let's create magic together
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>🚫 What's Not Cool</Text>
          <Text style={styles.termsText}>
            • Don't share personal contact info{"\n"}• No selling or promoting stuff{"\n"}• Keep it legal and fun{"\n"}•
            We'll remove accounts that break these rules{"\n"}• Use your best judgment
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>🔒 Your Data & Security</Text>
          <Text style={styles.termsText}>
            • Military-grade encryption protects your chats{"\n"}• We collect minimal anonymous usage data{"\n"}• Full
            compliance with privacy laws{"\n"}• Check our Privacy Policy for details{"\n"}• Your security is our
            obsession
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>⚠️ The Fine Print</Text>
          <Text style={styles.termsText}>
            • App provided "as is" - no guarantees{"\n"}• We're not responsible for user content{"\n"}• Use at your own
            risk and discretion{"\n"}• Terms may change - we'll let you know
          </Text>
        </View>
      </ScrollView>

      <View style={styles.termsFooter}>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            onPress={handleCheckboxToggle}
            style={[styles.checkboxBox, accepted ? styles.checkboxEnabled : styles.checkboxDisabled]}
            activeOpacity={0.7}
          >
            {accepted && <View style={styles.checkboxTick} />}
          </TouchableOpacity>
          <Text style={[styles.checkboxText, accepted ? styles.checkboxTextEnabled : styles.checkboxTextDisabled]}>
            {!hasScrolledToBottom && !accepted ? "Scroll down to continue" : "I'm ready to start my adventure"}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, !accepted && styles.buttonDisabled]}
            onPress={() => {
              if (accepted) onAccept()
            }}
            activeOpacity={0.8}
            disabled={!accepted}
          >
            <View style={[styles.solidButton, { backgroundColor: accepted ? "#8b5cf6" : "#6b7280" }]}>
              <Text style={styles.buttonText}>🚀 Let's Go!</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const WelcomeScreens = ({ onDone }: { onDone: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showTerms, setShowTerms] = useState(false)

  const scrollX = useRef(new Animated.Value(0)).current
  const flatListRef = useRef<Animated.FlatList<any>>(null)

  useEffect(() => {
    if (!showTerms && flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: currentIndex * width,
        animated: false,
      })
    }
  }, [currentIndex, showTerms])

  const onGestureEvent = Animated.event([{ nativeEvent: { translationX: scrollX } }], { useNativeDriver: false })

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent

      if (translationX < -50 || velocityX < -500) {
        if (currentIndex < slides.length - 1) {
          const nextIndex = currentIndex + 1
          setCurrentIndex(nextIndex)
        }
      } else if (translationX > 50 || velocityX > 500) {
        if (currentIndex > 0) {
          const prevIndex = currentIndex - 1
          setCurrentIndex(prevIndex)
        }
      }
    }
  }

  const handleBackFromTerms = () => {
    const lastSlideIndex = slides.length - 1
    setCurrentIndex(lastSlideIndex)
    setShowTerms(false)
  }

  const renderSlide = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={styles.slideContainer}>
        <StaticBackground variant={item.variant} />

        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>{item.icon}</View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </View>
      </View>
    )
  }

  if (showTerms) {
    return <TermsScreen onAccept={onDone} onBack={handleBackFromTerms} />
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.background}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              setShowTerms(true)
            }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
            <Animated.View style={styles.gestureContainer}>
              <Animated.FlatList
                ref={flatListRef}
                data={slides}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={true}
                getItemLayout={(data, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                  useNativeDriver: false,
                  listener: (event: any) => {
                    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width)
                    if (newIndex !== currentIndex && newIndex >= 0 && newIndex <= slides.length - 1) {
                      setCurrentIndex(newIndex)
                    }
                  },
                })}
                renderItem={renderSlide}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.round(event.nativeEvent.contentOffset.x / width)
                  setCurrentIndex(newIndex)
                }}
              />
            </Animated.View>
          </PanGestureHandler>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (currentIndex === slides.length - 1) {
                  setShowTerms(true)
                } else {
                  setCurrentIndex(currentIndex + 1)
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.solidButton}>
                <Text style={styles.buttonText}>{currentIndex === slides.length - 1 ? "Continue" : "Next"}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: "#064E3B",
  },
  gestureContainer: {
    flex: 1,
  },
  slideContainer: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  contentContainer: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    marginBottom: 60,
    alignItems: "center",
  },
  iconCircle: {
    borderRadius: 1000,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#34D399",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 17,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSection: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  actionButton: {
    marginBottom: 15,
    width: "85%",
  },
  solidButton: {
    backgroundColor: "#059669",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  // Terms screen styles
  termsScreenContainer: {
    flex: 1,
    backgroundColor: "#064E3B",
  },
  termsHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  titleContainer: {
    alignItems: "center",
  },
  termsTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  termsSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    fontWeight: "500",
  },
  termsScrollView: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 20,
    borderRadius: 20,
  },
  termsScrollContent: {
    padding: 25,
    paddingBottom: 40,
  },
  termsSection: {
    marginBottom: 30,
  },
  termsSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  termsText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 24,
  },
  termsFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  checkboxBox: {
    height: 26,
    width: 26,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  checkboxEnabled: {
    borderColor: "#8b5cf6",
    backgroundColor: "#8b5cf6",
  },
  checkboxDisabled: {
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "transparent",
  },
  checkboxTick: {
    height: 14,
    width: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  checkboxText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
    fontWeight: "600",
  },
  checkboxTextEnabled: {
    color: "#FFFFFF",
  },
  checkboxTextDisabled: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  buttonContainer: {
    alignItems: "center",
    width: "100%",
  },
})

export default WelcomeScreens
