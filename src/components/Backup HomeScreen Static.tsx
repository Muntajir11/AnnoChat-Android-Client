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
import LinearGradient from "react-native-linear-gradient"
import { Svg, Path, Circle } from "react-native-svg"

const { width, height } = Dimensions.get("window")

// Custom star icon component
const StarIcon = ({ size = 80, color = "#FFD700" }) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="40" stroke={color} strokeWidth="2" fill="transparent" />
      <Path d="M50 20 L58 40 L80 40 L62 55 L70 75 L50 62 L30 75 L38 55 L20 40 L42 40 Z" fill={color} />
    </Svg>
  </View>
)

// Shield icon component
const ShieldIcon = ({ size = 80, color = "#7B68EE" }) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 10 L85 25 L85 45 C85 65 70 85 50 95 C30 85 15 65 15 45 L15 25 Z" fill={color} />
      <Path
        d="M40 50 L45 60 L65 40"
        fill="transparent"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
)

// Lightning icon component
const LightningIcon = ({ size = 80, color = "#FF6B6B" }) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M55 10 L30 50 L50 50 L45 90 L70 50 L50 50 Z" fill={color} />
    </Svg>
  </View>
)

// Planet icon component
const PlanetIcon = ({ size = 80, color = "#4ECDC4" }) => (
  <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="35" fill={color} />
      <Path
        d="M30 40 C35 30 45 25 55 30 C65 35 75 45 70 60 C65 75 50 75 40 65 C30 55 25 50 30 40 Z"
        fill="rgba(255, 255, 255, 0.3)"
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
    title: "Welcome to\nAnnoChat",
    subtitle: "Connect • Chat • Discover",
    description: "Where strangers become stories",
    icon: <StarIcon />,
  },
  {
    title: "Stay\nAnonymous",
    subtitle: "Privacy First",
    description: "Your identity remains completely private and secure",
    icon: <ShieldIcon />,
  },
  {
    title: "Instant\nMatching",
    subtitle: "Quick Connections",
    description: "Find someone to chat with in seconds",
    icon: <LightningIcon />,
  },
  {
    title: "Global\nCommunity",
    subtitle: "Worldwide Reach",
    description: "Connect with people from around the world",
    icon: <PlanetIcon />,
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
      <View style={styles.termsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <BackArrowIcon />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.termsTitle}>Terms & Privacy</Text>
          <Text style={styles.termsSubtitle}>By continuing, you agree to the following:</Text>
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

          // Only update hasScrolledToBottom if not already accepted
          if (!accepted && offsetY + layoutHeight >= contentHeight - 50) {
            setHasScrolledToBottom(true)
          }
        }}
      >
        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>1. Privacy & Anonymity</Text>
          <Text style={styles.termsText}>
            • Your identity remains completely anonymous during chats{"\n"}• We don't store personal information or chat
            histories{"\n"}• Your conversations disappear when ended{"\n"}• No registration required - start chatting
            immediately
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>2. Community Guidelines</Text>
          <Text style={styles.termsText}>
            • Treat others with respect and kindness{"\n"}• No harassment, hate speech, or inappropriate content{"\n"}•
            Users must be 18+ to use this platform{"\n"}• Report any concerning behavior immediately{"\n"}• Maintain a
            positive and welcoming environment
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>3. Usage Policy</Text>
          <Text style={styles.termsText}>
            • Don't share personal contact information{"\n"}• No solicitation or commercial activities{"\n"}• Don't use
            AnnoChat for illegal purposes{"\n"}• We reserve the right to terminate accounts that violate these terms
            {"\n"}• Use the platform responsibly and ethically
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>4. Data & Security</Text>
          <Text style={styles.termsText}>
            • We use encryption to protect your conversations{"\n"}• Anonymous usage data may be collected to improve
            service{"\n"}• We comply with all applicable privacy laws{"\n"}• Read our full Privacy Policy for more
            details{"\n"}• Your data security is our top priority
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsSectionTitle}>5. Disclaimer</Text>
          <Text style={styles.termsText}>
            • AnnoChat is provided "as is" without warranties{"\n"}• We are not responsible for user-generated content
            {"\n"}• Use at your own discretion and risk{"\n"}• Terms may be updated periodically
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
            {!hasScrolledToBottom && !accepted ? "Scroll to bottom to accept" : "I accept the Terms and Privacy Policy"}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (accepted) onAccept()
            }}
            activeOpacity={0.8}
            disabled={!accepted}
          >
            <LinearGradient
              colors={!accepted ? ["#666", "#888", "#666"] : ["#9C42F5", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.buttonGradient, !accepted && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
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

  // Effect to sync FlatList position when currentIndex changes
  useEffect(() => {
    if (!showTerms && flatListRef.current) {
      // Use scrollToOffset instead of scrollToIndex to avoid layout issues
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
        // Swipe left - next slide
        if (currentIndex < slides.length - 1) {
          const nextIndex = currentIndex + 1
          setCurrentIndex(nextIndex)
        }
      } else if (translationX > 50 || velocityX > 500) {
        // Swipe right - previous slide
        if (currentIndex > 0) {
          const prevIndex = currentIndex - 1
          setCurrentIndex(prevIndex)
        }
      }
    }
  }

  const handleBackFromTerms = () => {
    // First set the index to the last slide
    const lastSlideIndex = slides.length - 1
    setCurrentIndex(lastSlideIndex)
    // Then hide the terms screen
    setShowTerms(false)
  }

  const renderSlide = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={styles.slideContainer}>
        {/* Main content */}
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

  // If showing terms screen, render it instead of the slides
  if (showTerms) {
    return <TermsScreen onAccept={onDone} onBack={handleBackFromTerms} />
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.background}>
          {/* Skip button */}
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

          {/* Bottom section */}
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
              <LinearGradient
                colors={["#9C42F5", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>{currentIndex === slides.length - 1 ? "Continue" : "Next"}</Text>
              </LinearGradient>
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
    backgroundColor: "#1A1A40",
  },
  gestureContainer: {
    flex: 1,
  },
  slideContainer: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  contentContainer: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 25,
    padding: 30,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E0E0FF",
    textAlign: "center",
    marginBottom: 15,
    opacity: 0.9,
  },
  description: {
    fontSize: 15,
    color: "#CCCCFF",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.8,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
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
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  // Terms screen styles
  termsScreenContainer: {
    flex: 1,
    backgroundColor: "#1A1A40",
  },
  termsHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  titleContainer: {
    alignItems: "center",
  },
  termsTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  termsSubtitle: {
    fontSize: 16,
    color: "#E0E0FF",
    textAlign: "center",
    fontWeight: "400",
    opacity: 0.9,
  },
  termsScrollView: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 20,
    borderRadius: 15,
  },
  termsScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  termsSection: {
    marginBottom: 25,
  },
  termsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    color: "#CCCCFF",
    lineHeight: 22,
    opacity: 0.9,
  },
  termsFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxBox: {
    height: 24,
    width: 24,
    borderWidth: 2,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxEnabled: {
    borderColor: "#9C42F5",
    backgroundColor: "rgba(156, 66, 245, 0.2)",
  },
  checkboxDisabled: {
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  checkboxTick: {
    height: 12,
    width: 12,
    backgroundColor: "#9C42F5",
    borderRadius: 2,
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  checkboxTextEnabled: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  checkboxTextDisabled: {
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "400",
  },
  buttonContainer: {
    alignItems: "center",
    width: "100%",
  },
})

export default WelcomeScreens
