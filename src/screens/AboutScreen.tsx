import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';

interface AboutScreenProps {
  navigation: any;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    // Get app version dynamically
    const version = DeviceInfo.getVersion();
    setAppVersion(version);
  }, []);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="chatbubbles" size={48} color="#4CAF50" />
            </View>
            {/* Animated rings around icon */}
            <View style={[styles.ring, styles.ring1]} />
            <View style={[styles.ring, styles.ring2]} />
          </View>
          <Text style={styles.appName}>ANNOCHAT</Text>
          <View style={styles.versionContainer}>
            <Text style={styles.version}>Version {appVersion}</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>About Us</Text>
            </View>
            <Text style={styles.sectionText}>
              AnnoChat is a platform that lets you connect with strangers around
              the globe through real-time, anonymous chatting. Whether you want to
              make new friends, explore new cultures, or simply talk to someone
              without revealing your identity, AnnoChat provides a safe and
              intuitive space to do just that.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="rocket" size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Our Mission</Text>
            </View>
            <Text style={styles.sectionText}>
              Our mission is to break down social barriers and connect people
              beyond borders by providing a simple and secure way to chat
              anonymously. We believe that everyone deserves a voice, and AnnoChat
              offers a place to express, listen, and be heard—freely and without
              judgment.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Privacy & Security</Text>
            </View>
            <Text style={styles.sectionText}>
              We take your privacy seriously. AnnoChat does not require any
              personal identification to start chatting, and we do not store or
              share your chat data. Our systems are designed to provide a
              temporary and secure interaction between users, ensuring your
              anonymity is respected at all times.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="mail" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Contact</Text>
            </View>
            <Text style={styles.sectionText}>
              Email: annochat.social@gmail.com{'\n'}
            </Text>
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://annochat.social/')}
              style={styles.linkButton}
              activeOpacity={0.8}>
              <View style={styles.linkIconContainer}>
                <Ionicons name="globe" size={16} color="#4CAF50" />
              </View>
              <Text style={styles.linkText}>Visit annochat.social</Text>
              <Ionicons name="arrow-forward" size={14} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.6)',
    backgroundColor: '#0A0A0F',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  ring1: {
    width: 100,
    height: 100,
    zIndex: 1,
  },
  ring2: {
    width: 120,
    height: 120,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    zIndex: 0,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  versionContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  version: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    alignSelf: 'flex-start',
  },
  linkIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    flex: 1,
  },
});
