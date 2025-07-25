import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ChatModeSelectionScreenProps {
  navigation: any;
}

const { width, height } = Dimensions.get('window');

export const ChatModeSelectionScreen: React.FC<ChatModeSelectionScreenProps> = ({
  navigation,
}) => {
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const particleAnim1 = useRef(new Animated.Value(0)).current;
  const particleAnim2 = useRef(new Animated.Value(0)).current;
  const particleAnim3 = useRef(new Animated.Value(0)).current;

  // Mock data
  const [textUsers] = useState(1247);
  const [videoUsers] = useState(892);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.1),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous animations
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    // Floating particles - constrained to safe area
    const particleAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim1, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim1, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const particleAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim2, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim2, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const particleAnimation3 = Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim3, {
          toValue: 1,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim3, {
          toValue: 0,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();
    glowAnimation.start();
    floatAnimation.start();
    particleAnimation1.start();
    particleAnimation2.start();
    particleAnimation3.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
      floatAnimation.stop();
      particleAnimation1.stop();
      particleAnimation2.stop();
      particleAnimation3.stop();
    };
  }, []);

  const handleTextChat = () => {
    navigation.navigate('TextChat');
  };

  const handleVideoChat = () => {
    navigation.navigate('VideoChat');
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  // Particle animations - constrained within safe area
  const safeAreaHeight = height - 100; // Account for status bar and safe area

  const particle1Y = particleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [safeAreaHeight, 100], // Start from bottom of safe area, end at top of safe area
  });

  const particle2Y = particleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [safeAreaHeight, 100],
  });

  const particle3Y = particleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [safeAreaHeight, 100],
  });

  const particle1Opacity = particleAnim1.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.6, 0.6, 0],
  });

  const particle2Opacity = particleAnim2.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.4, 0.4, 0],
  });

  const particle3Opacity = particleAnim3.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.3, 0.3, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Background Particles - Now inside SafeAreaView */}
        <Animated.View
          style={[
            styles.particle,
            styles.particle1,
            {
              transform: [{ translateY: particle1Y }],
              opacity: particle1Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle2,
            {
              transform: [{ translateY: particle2Y }],
              opacity: particle2Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle3,
            {
              transform: [{ translateY: particle3Y }],
              opacity: particle3Opacity,
            },
          ]}
        />

        {/* Header */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.centralOrb,
              {
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) },
                  { translateY: floatY }
                ],
              },
            ]}
          >
            <View style={styles.orbInner}>
              <Ionicons name="chatbubbles" size={45} color="#FFFFFF" />
            </View>
            <Animated.View style={[styles.orbitalRing1, { opacity: glowOpacity }]} />
            <View style={styles.orbitalRing2} />
            <View style={styles.orbitalRing3} />
          </Animated.View>

          <Text style={styles.title}>Choose Your Vibe</Text>
          <Text style={styles.subtitle}>Connect with amazing people worldwide</Text>
        </View>

        {/* Decorative Stats Section - Fixed container */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={14} color="#4ECDC4" />
            </View>
            <Text style={styles.statText}>2.1k+ online</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="flash" size={14} color="#FFD93D" />
            </View>
            <Text style={styles.statText}>Instant match</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="shield-checkmark" size={14} color="#4ECDC4" />
            </View>
            <Text style={styles.statText}>Safe & secure</Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Text Chat */}
          <TouchableOpacity
            style={styles.textOption}
            onPress={handleTextChat}
            activeOpacity={0.7}
          >
            <View style={styles.optionGlow} />
            <View style={styles.optionContent}>
              <View style={styles.optionLeft}>
                <View style={styles.textIconContainer}>
                  <Ionicons name="chatbubble-ellipses" size={24} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Text</Text>
                  <Text style={styles.optionSubtitle}>Words & Minds</Text>
                </View>
              </View>
              
              <View style={styles.optionRight}>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDotText} />
                  <Text style={styles.statusNumber}>{(textUsers/1000).toFixed(1)}k</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8B5CF6" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Video Chat */}
          <TouchableOpacity
            style={styles.videoOption}
            onPress={handleVideoChat}
            activeOpacity={0.7}
          >
            <View style={styles.optionGlow} />
            <View style={styles.optionContent}>
              <View style={styles.optionLeft}>
                <View style={styles.videoIconContainer}>
                  <Ionicons name="videocam" size={24} color="#FF6B6B" />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Video</Text>
                  <Text style={styles.optionSubtitle}>Face to Face</Text>
                </View>
              </View>
              
              <View style={styles.optionRight}>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDotVideo} />
                  <Text style={styles.statusNumber}>{Math.round(videoUsers/1000)}k</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FF6B6B" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="globe-outline" size={18} color="#6B7280" />
            <Text style={styles.featureText}>Global community</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart-outline" size={18} color="#6B7280" />
            <Text style={styles.featureText}>Make new friends</Text>
          </View>
        </View>

        {/* Bottom */}
        <View style={styles.bottomContainer}>
          <View style={styles.bottomIndicator}>
            <View style={styles.indicatorDot} />
            <Text style={styles.bottomText}>Instant connections</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    zIndex: 0, // Behind content
  },
  particle1: {
    left: '20%',
    backgroundColor: '#4ECDC4',
  },
  particle2: {
    left: '70%',
    backgroundColor: '#8B5CF6',
  },
  particle3: {
    left: '85%',
    backgroundColor: '#FF6B6B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    position: 'relative',
    zIndex: 1, // Above particles
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  centralOrb: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  orbInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
  },
  orbitalRing1: {
    position: 'absolute',
    width: 115,
    height: 115,
    borderRadius: 57.5,
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.5)',
    borderStyle: 'dashed',
  },
  orbitalRing2: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 62.5,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  orbitalRing3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed from center to space-between
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 14, // Reduced padding
    paddingHorizontal: 16, // Reduced padding
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4, // Add margin to prevent overflow
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // Reduced gap
    flex: 1, // Allow items to take equal space
    justifyContent: 'center',
  },
  statIcon: {
    width: 20, // Reduced size
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    fontSize: 11, // Reduced font size
    color: '#A0A0B8',
    fontWeight: '600',
    flexShrink: 1, // Allow text to shrink if needed
  },
  statDivider: {
    width: 1,
    height: 14, // Reduced height
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8, // Reduced margin
  },
  optionsContainer: {
    gap: 16,
    paddingHorizontal: 4,
    marginBottom: 30,
  },
  textOption: {
    position: 'relative',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    overflow: 'hidden',
  },
  videoOption: {
    position: 'relative',
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    overflow: 'hidden',
  },
  optionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  textIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  videoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#A0A0B8',
    fontWeight: '500',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDotText: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ECDC4',
  },
  statusDotVideo: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD93D',
  },
  statusNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  bottomIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4ECDC4',
  },
  bottomText: {
    fontSize: 12,
    color: '#6B6B8A',
    fontWeight: '600',
  },
});