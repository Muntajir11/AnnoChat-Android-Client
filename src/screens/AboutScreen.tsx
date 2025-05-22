import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
} from 'react-native';

export const AboutScreen = ({navigation}: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>About</Text>

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/wow.png')}
            style={styles.logo}
          />
          <Text style={styles.appName}>AnnoChat</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <Text style={styles.sectionText}>
            AnnoChat is a platform that lets you connect with strangers around
            the globe through real-time, anonymous chatting. Whether you want to
            make new friends, explore new cultures, or simply talk to someone
            without revealing your identity, AnnoChat provides a safe and
            intuitive space to do just that.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            Our mission is to break down social barriers and connect people
            beyond borders by providing a simple and secure way to chat
            anonymously. We believe that everyone deserves a voice, and AnnoChat
            offers a place to express, listen, and be heard—freely and without
            judgment.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Text style={styles.sectionText}>
            We take your privacy seriously. AnnoChat does not require any
            personal identification to start chatting, and we do not store or
            share your chat data. Our systems are designed to provide a
            temporary and secure interaction between users, ensuring your
            anonymity is respected at all times.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.sectionText}>
            Email: annochat.social@gmail.com{'\n'}
            <Text
              style={styles.linkText}
              onPress={() => Linking.openURL('https://annochat.social/')}>
              Website: www.annochat.social
            </Text> {'\n'}
            {/* Follow us on social media to stay updated with the latest features
            and improvements. */}
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
  },
  header: {
    fontSize: 26,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 15,
  },
  appName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  version: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 24,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  backText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },

  linkText: {
  fontSize: 16,
  color: '#4aaaff',
  marginBottom: 10,
},

});
