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
  Clipboard
} from 'react-native';

export const SupportFeedbackScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  
  const handleSubmit = () => {
    if (!name.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Prepare email content
    const recipient = 'annochat.social@gmail.com';
    const subject = encodeURIComponent(`Feedback from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nMessage:\n${message}`);
    
    // Create Gmail specific intent
    const gmailUrl = `googlegmail://co?to=${recipient}&subject=${subject}&body=${body}`;
    
    // Try opening Gmail app first
    Linking.canOpenURL(gmailUrl)
      .then(supported => {
        if (supported) {
          // Gmail app is installed, open it
          return Linking.openURL(gmailUrl);
        } else {
          // Gmail app is not installed, try generic mailto
          const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;
          return Linking.openURL(mailtoUrl)
            .catch(err => {
              // If mailto also fails, offer to copy the content
              Alert.alert(
                'Email App Not Found',
                'Would you like to copy the feedback to clipboard instead?',
                [
                  {
                    text: 'Yes, Copy',
                    onPress: () => {
                      const feedbackText = `To: ${recipient}\nSubject: Feedback from ${name}\n\nName: ${name}\n\nMessage:\n${message}`;
                      Clipboard.setString(feedbackText);
                      Alert.alert('Success', 'Feedback copied to clipboard');
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  }
                ]
              );
            });
        }
      })
      .catch(error => {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      });
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Support & Feedback</Text>
      
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          We value your feedback and are here to help with any questions or concerns. 
          Please fill out the form below and we'll get back to you as soon as possible.
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Type your message here..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
        </View>
        
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Send Feedback</Text>
        </TouchableOpacity>
        
        <View style={styles.directContactContainer}>
          <Text style={styles.directContactTitle}>Direct Contact</Text>
          <Text style={styles.directContactText}>
            Email: annochat.social@gmail.com{'\n'}
            Hours: Monday-Friday, 9AM-5PM IST
          </Text>
        </View>
      </ScrollView>
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#111', 
    padding: 20 
  },
  header: { 
    fontSize: 26, 
    color: '#fff', 
    marginBottom: 20, 
    fontWeight: 'bold' 
  },
  formContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 25,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  messageInput: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  directContactContainer: {
    marginBottom: 30,
  },
  directContactTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10,
  },
  directContactText: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 24,
  },
  backButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  backText: { 
    color: '#aaa', 
    fontSize: 16, 
    textAlign: 'center' 
  },
});