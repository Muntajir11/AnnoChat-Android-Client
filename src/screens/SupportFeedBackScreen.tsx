import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Alert,
  Linking,
  Clipboard,
  StatusBar,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SupportFeedbackScreenProps {
  navigation: any;
}

export const SupportFeedbackScreen: React.FC<SupportFeedbackScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

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
  
  const handleSubmit = () => {
    if (!name.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Prepare email content
    const recipient = 'annochat.social@gmail.com';
    const subject = encodeURIComponent(`Feedback from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nMessage:\n${message}`);
    
    // Create mailto URL
    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;
    
    Linking.openURL(mailtoUrl)
      .catch(() => {
        // If mailto fails, offer to copy the content
        Alert.alert(
          'Email App Not Found',
          'Would you like to copy the feedback to clipboard instead?',
          [
            {
              text: 'Yes, Copy',
              onPress: () => {
                const clipboardText = `To: ${recipient}\nSubject: Feedback from ${name}\n\nName: ${name}\nMessage:\n${message}`;
                Clipboard.setString(clipboardText);
                Alert.alert('Copied!', 'Feedback has been copied to clipboard. You can paste it in your email app.');
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      });
  };

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
        <Text style={styles.headerTitle}>Support & Feedback</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          <Animated.View style={[styles.iconSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons name="help-circle" size={48} color="#FF6B6B" />
              </View>
              {/* Animated rings around icon */}
              <View style={[styles.ring, styles.ring1]} />
              <View style={[styles.ring, styles.ring2]} />
            </View>
            <Text style={styles.title}>We're Here to Help</Text>
            <Text style={styles.subtitle}>
              Have a question, suggestion, or found a bug? We'd love to hear from you!
            </Text>
          </Animated.View>

          <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="person" size={16} color="#8B5CF6" />
                <Text style={styles.label}>Your Name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="rgba(203, 213, 225, 0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#4CAF50" />
                <Text style={styles.label}>Your Message</Text>
              </View>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us what's on your mind..."
                placeholderTextColor="rgba(203, 213, 225, 0.5)"
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}>
              <View style={styles.submitIconContainer}>
                <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.submitText}>Send Feedback</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.contactSection, { opacity: fadeAnim }]}>
            <View style={styles.contactHeader}>
              <Ionicons name="mail" size={20} color="#8B5CF6" />
              <Text style={styles.contactTitle}>Other Ways to Reach Us</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL('mailto:annochat.social@gmail.com')}
              activeOpacity={0.8}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.contactText}>annochat.social@gmail.com</Text>
              <Ionicons name="arrow-forward" size={14} color="#8B5CF6" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL('https://annochat.social')}
              activeOpacity={0.8}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="globe" size={18} color="#FF6B6B" />
              </View>
              <Text style={styles.contactText}>Visit our website</Text>
              <Ionicons name="arrow-forward" size={14} color="#8B5CF6" />
            </TouchableOpacity>
          </Animated.View>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
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
    padding: 24,
    paddingBottom: 40,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 1,
    opacity: 0.3,
  },
  ring1: {
    width: 100,
    height: 100,
    borderColor: '#FF6B6B',
  },
  ring2: {
    width: 120,
    height: 120,
    borderColor: '#8B5CF6',
    opacity: 0.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(203, 213, 225, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 50,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(203, 213, 225, 0.9)',
    fontWeight: '500',
  },
});