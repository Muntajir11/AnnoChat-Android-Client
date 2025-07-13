import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Header } from '../components/Header';

const { width, height } = Dimensions.get('window');

interface VideoChatScreenProps {
  onMenuPress?: () => void;
  onChatStatusChange?: (isConnected: boolean) => void;
}

export const VideoChatScreen: React.FC<VideoChatScreenProps> = ({ onMenuPress, onChatStatusChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Call onChatStatusChange whenever isConnected changes
  useEffect(() => {
    onChatStatusChange?.(isConnected);
  }, [isConnected, onChatStatusChange]);

  const handleFindMatch = () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 1500); // 1.5 second delay
    
    // TODO: Implement video match finding
    setIsSearching(true);
    setStatus('Searching for a video match...');
    
    // Simulate search for demo purposes
    setTimeout(() => {
      setIsSearching(false);
      setStatus('Ready');
    }, 3000);
    
    console.log('Finding video match...');
  };

  const handleCancelSearch = () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 1000); // 1 second delay
    
    setIsSearching(false);
    setStatus('Ready');
  };

  const handleDisconnect = () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 1000); // 1 second delay
    
    // TODO: Implement video disconnect
    setIsConnected(false);
    setIsSearching(false);
    setStatus('Ready');
    console.log('Disconnecting video...');
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
  };

  return (
    <View style={styles.container}>
      <Header 
        isConnected={isConnected} 
        onlineUsers={onlineUsers} 
        status={status}
        onMenuPress={onMenuPress} 
      />
      
      {/* Video Area */}
      <View style={styles.videoContainer}>
        {/* Remote Video Placeholder */}
        <View style={styles.remoteVideo}>
          <View style={styles.videoPlaceholder}>
            {isSearching ? (
              <>
                <ActivityIndicator size="large" color="#34D399" />
                <Text style={styles.searchingVideoText}>Searching for a match...</Text>
              </>
            ) : (
              <>
                <Ionicons name="person-outline" size={60} color="#6B7280" />
                <Text style={styles.placeholderText}>Waiting for stranger...</Text>
              </>
            )}
          </View>
        </View>
        
        {/* Local Video Placeholder */}
        <View style={styles.localVideo}>
          <View style={styles.localVideoPlaceholder}>
            <Ionicons 
              name={isCameraOn ? "videocam" : "videocam-off"} 
              size={30} 
              color={isCameraOn ? "#10B981" : "#EF4444"} 
            />
          </View>
        </View>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Camera Toggle */}
        <TouchableOpacity
          style={[styles.controlButton, isCameraOn ? styles.activeControl : styles.inactiveControl]}
          onPress={toggleCamera}
          activeOpacity={0.8}>
          <Ionicons 
            name={isCameraOn ? "videocam" : "videocam-off"} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>

        {/* Find/Disconnect Button */}
        <TouchableOpacity
          style={[
            styles.mainButton, 
            isSearching ? styles.disconnectButton : styles.findButton,
            isButtonDisabled && styles.disabledButton
          ]}
          onPress={isConnected ? handleDisconnect : isSearching ? handleCancelSearch : handleFindMatch}
          disabled={isButtonDisabled}
          activeOpacity={0.8}>
          <Ionicons 
            name={isConnected ? "stop" : isSearching ? "close" : "search"} 
            size={24} 
            color="#FFFFFF" 
          />
          <Text style={[
            styles.mainButtonText,
            isButtonDisabled && styles.disabledButtonText
          ]}>
            {isSearching ? 'CANCEL' : isConnected ? 'DISCONNECT' : 'FIND MATCH'}
          </Text>
        </TouchableOpacity>

        {/* Mic Toggle */}
        <TouchableOpacity
          style={[styles.controlButton, isMicOn ? styles.activeControl : styles.inactiveControl]}
          onPress={toggleMic}
          activeOpacity={0.8}>
          <Ionicons 
            name={isMicOn ? "mic" : "mic-off"} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Status Message */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Video chat functionality coming soon!
        </Text>
        <Text style={styles.subStatusText}>
          This is the UI preview for video chat feature
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#1E293B',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  searchingVideoText: {
    color: '#6EE7B7',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  localVideo: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 100,
    height: 140,
    backgroundColor: '#334155',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  controlPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 211, 153, 0.2)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  activeControl: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  inactiveControl: {
    backgroundColor: '#334155',
    borderColor: '#64748B',
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    minWidth: 140,
  },
  findButton: {
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disconnectButton: {
    backgroundColor: '#DC2626',
  },
  disabledButton: {
    backgroundColor: '#334155',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    opacity: 0.6,
  },
  mainButtonText: {
    color: '#F0FDF4',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#1E293B',
  },
  statusText: {
    color: '#6EE7B7',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  subStatusText: {
    color: '#CBD5E1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
