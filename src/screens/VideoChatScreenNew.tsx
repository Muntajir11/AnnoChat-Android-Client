import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  PanResponder,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Header } from '../components/Header';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import config, { ICE_SERVERS } from '../config/config';
import { requestCameraAndMicrophonePermissions } from '../utils/permissions';
import { getVideoToken } from '../utils/videoToken';
import { useAudioManager } from '../utils/useAudioManager';

const { width, height } = Dimensions.get('window');

const WEBSOCKET_URL = config.videoUrl;

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "searching" | "matched" | "in-call";

interface VideoChatScreenProps {
  onMenuPress?: () => void;
  onChatStatusChange?: (isConnected: boolean) => void;
}

export const VideoChatScreen: React.FC<VideoChatScreenProps> = ({ onMenuPress, onChatStatusChange }) => {
  // Audio management hook
  const {
    currentDevice,
    availableDevices,
    isAudioSetup,
    setupAudioForVideoCall,
    switchToSpeaker,
    switchToEarpiece,
    switchToBluetooth,
    restoreAudioSettings,
  } = useAudioManager();

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user'); // 'user' = front, 'environment' = back
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocalVideoLarge, setIsLocalVideoLarge] = useState(false);
  const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(true);
  const [videoKey, setVideoKey] = useState(0); // Add key to force video re-render

  // Draggable local video position - start in top right
  const localVideoPosition = useRef(new Animated.ValueXY({ x: width - 130, y: 20 })).current;

  // WebRTC and signaling refs
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Call state refs
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [role, setRole] = useState<"caller" | "callee" | null>(null);

  // Call timer state
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pan responder for draggable local video
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        localVideoPosition.setOffset({
          x: (localVideoPosition.x as any)._value,
          y: (localVideoPosition.y as any)._value,
        });
        localVideoPosition.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: localVideoPosition.x, dy: localVideoPosition.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        localVideoPosition.flattenOffset();
        
        // Simplified bounds calculation - use screen dimensions for now
        const currentX = (localVideoPosition.x as any)._value;
        const currentY = (localVideoPosition.y as any)._value;
        
        const videoWidth = 100;
        const videoHeight = 140;
        
        // Use screen bounds with safe margins
        const minX = 10;
        const maxX = width - videoWidth - 10;
        const minY = 80; // Below header
        const maxY = height - videoHeight - 200; // Above controls
        
        const boundedX = Math.max(minX, Math.min(currentX, maxX));
        const boundedY = Math.max(minY, Math.min(currentY, maxY));
        
        if (currentX !== boundedX || currentY !== boundedY) {
          Animated.spring(localVideoPosition, {
            toValue: { x: boundedX, y: boundedY },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Call onChatStatusChange whenever isConnected changes
  useEffect(() => {
    onChatStatusChange?.(isConnected);
  }, [isConnected, onChatStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Call timer effect
  useEffect(() => {
    if (isInCall) {
      // Start timer when call begins
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      // Stop and reset timer when call ends
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [isInCall]);

  // Monitor remote stream for video track changes
  useEffect(() => {
    if (remoteStreamRef.current && isInCall) {
      const checkVideoTracks = () => {
        const videoTracks = remoteStreamRef.current?.getVideoTracks() || [];
        const hasActiveVideo = videoTracks.length > 0 && 
                              videoTracks[0].enabled && 
                              videoTracks[0].readyState !== 'ended' && 
                              videoTracks[0].readyState !== 'muted';
        
        console.log('Checking remote video status:', {
          tracksCount: videoTracks.length,
          enabled: videoTracks[0]?.enabled,
          readyState: videoTracks[0]?.readyState,
          hasActiveVideo
        });
        
        setIsRemoteCameraOn(hasActiveVideo);
      };

      // Check initially
      checkVideoTracks();

      // Set up an interval to check more frequently
      const interval = setInterval(checkVideoTracks, 500); // Check every 500ms

      return () => clearInterval(interval);
    } else {
      setIsRemoteCameraOn(true); // Reset when not in call
    }
  }, [isInCall, remoteStreamRef.current]);

  // Format call duration to MM:SS
  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Stop call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);

    // Restore audio settings
    if (isAudioSetup) {
      restoreAudioSettings().catch(console.error);
    }

    setIsCameraOn(true);
    setIsMicOn(true);
    setIsInCall(false);
    setIsProcessing(false);
    setIsLocalVideoLarge(false); // Reset video toggle to normal
    setConnectionStatus("disconnected");
    setStatusMessage("");
    setError("");
    setRoomId(null);
    setPartnerId(null);
    setRole(null);
    setIsConnected(false);
    setIsSearching(false);
    setStatus('Ready');
  };

  const connectToServer = async () => {
    try {
      setConnectionStatus("connecting");
      setStatusMessage("Getting authorization...");
      setError("");

      console.log('Connecting to production video chat server...');

      // Fetch token from your web client API
      const { token, signature, expiresAt } = await getVideoToken();

      setStatusMessage("Connecting to server...");

      // Connect with token parameters to production server
      const wsUrl = `${WEBSOCKET_URL}?token=${token}&signature=${signature}&expiresAt=${expiresAt}`;
      console.log('Connecting to:', WEBSOCKET_URL);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to video chat server');
        setConnectionStatus("connected");
        setStatusMessage("Connected to server");
        setIsConnected(false); // Keep as false until in a call
        wsRef.current = ws;
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          await handleServerMessage(message);
        } catch (error) {
          console.error("Error parsing server message:", error);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from video chat server');
        setConnectionStatus("disconnected");
        setStatusMessage("Disconnected from server");
        setIsConnected(false);
        wsRef.current = null;
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection lost. Please check your internet and try reconnecting.");
        setConnectionStatus("disconnected");
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Error connecting to server:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("Rate limit exceeded")) {
        // Extract retry time if available
        const retryMatch = errorMessage.match(/Try again in (\d+) seconds/);
        const retryTime = retryMatch ? retryMatch[1] : "60";
        setError(`Too many connection attempts. Please wait ${retryTime} seconds and try again.`);
      } else if (errorMessage.includes("Network error") || errorMessage.includes("Cannot reach annochat.social")) {
        setError("Can't connect to our servers. Please check your internet connection and try again.");
      } else if (errorMessage.includes("Request timeout")) {
        setError("Connection is taking too long. Please check your internet and try again.");
      } else if (errorMessage.includes("Video token API endpoint not found")) {
        setError("Service temporarily unavailable. Our team is working on it. Please try again later.");
      } else if (errorMessage.includes("Server error")) {
        setError("Our servers are having issues. Please try again in a few minutes.");
      } else if (errorMessage.includes("Failed to get authorization")) {
        setError("Authorization failed. Please try connecting again.");
      } else {
        setError("Unable to connect. Please check your internet and try again.");
      }
      setConnectionStatus("disconnected");
      setIsConnected(false);
    }
  };

  const handleServerMessage = async (message: any) => {
    const { event, data } = message;

    switch (event) {
      case "connected":
        break;

      case "searching":
        setConnectionStatus("searching");
        setStatusMessage("Searching for a match...");
        setStatus("Searching for a match...");
        setIsSearching(true);
        setError("");
        setIsProcessing(false);
        break;

      case "search-canceled":
        setConnectionStatus("connected");
        setStatusMessage("Search canceled");
        setStatus("Ready");
        setIsSearching(false);
        setError("");
        break;

      case "match-found":
        setConnectionStatus("matched");
        setStatusMessage("Match found! Preparing video call...");
        setStatus("Match found! Connecting...");
        setIsSearching(false);
        setError("");
        setRoomId(data.roomId);
        setPartnerId(data.partnerId);
        setRole(data.role);
        await initializeCall(data.role === "caller");
        break;

      case "webrtc-offer":
        await handleWebRTCOffer(data);
        break;

      case "webrtc-answer":
        await handleWebRTCAnswer(data);
        break;

      case "webrtc-ice-candidate":
        await handleWebRTCIceCandidate(data);
        break;

      case "partner-left":
      case "partner-disconnected":
        handlePartnerLeft();
        break;

      case "call-ended":
        handleCallEnded();
        break;

      case "error":
        const serverError = data.message || "Unknown error";
        if (serverError.includes("Rate limit") || serverError.includes("rate limit")) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else if (serverError.includes("Network") || serverError.includes("connection")) {
          setError("Connection issue. Please check your internet and try again.");
        } else {
          setError(serverError);
        }
        break;

      default:
        // Unknown server message - silently ignored
        break;
    }
  };

  const initializeCall = async (isInitiator: boolean) => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceTransportPolicy: "all",
      });
      peerConnectionRef.current = peerConnection;

      // For React Native WebRTC, we might need to use addStream instead of addTrack
      if (localStreamRef.current) {
        try {
          // Try addTrack first (modern approach)
          localStreamRef.current.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStreamRef.current!);
          });
          console.log('Using addTrack method');
        } catch (error) {
          // Fallback to addStream if addTrack doesn't work
          console.log('addTrack failed, trying addStream:', error);
          (peerConnection as any).addStream(localStreamRef.current);
          console.log('Using addStream method');
        }
      }

      // Handle remote stream - try both approaches
      (peerConnection as any).ontrack = (event: any) => {
        console.log('Received remote stream via ontrack');
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          
          // Check if the stream has video tracks
          const videoTracks = event.streams[0].getVideoTracks();
          const hasActiveVideo = videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState !== 'ended';
          setIsRemoteCameraOn(hasActiveVideo);
          console.log('Remote camera status on track received:', hasActiveVideo, 'tracks:', videoTracks.length);
          
          // Listen for track events on the stream
          event.streams[0].addEventListener('removetrack', (e: any) => {
            console.log('Remote track removed:', e.track.kind);
            if (e.track.kind === 'video') {
              console.log('Remote video track removed - setting camera off');
              setIsRemoteCameraOn(false);
            }
          });
          
          event.streams[0].addEventListener('addtrack', (e: any) => {
            console.log('Remote track added:', e.track.kind);
            if (e.track.kind === 'video') {
              console.log('Remote video track added - setting camera on');
              setIsRemoteCameraOn(true);
            }
          });
          
          // Also listen for track state changes on individual video tracks
          videoTracks.forEach((track: any) => {
            track.addEventListener('ended', () => {
              console.log('Remote video track ended - setting camera off');
              setIsRemoteCameraOn(false);
            });
            
            track.addEventListener('mute', () => {
              console.log('Remote video track muted - setting camera off');
              setIsRemoteCameraOn(false);
            });
            
            track.addEventListener('unmute', () => {
              console.log('Remote video track unmuted - setting camera on');
              setIsRemoteCameraOn(true);
            });
          });
          
          setIsInCall(true);
          setIsConnected(true);
          setConnectionStatus("in-call");
          setStatusMessage("Connected!");
          setStatus("Connected!");
          setError("");
        }
      };

      // Also handle addstream event (fallback)
      (peerConnection as any).onaddstream = (event: any) => {
        console.log('Received remote stream via onaddstream');
        if (event.stream) {
          remoteStreamRef.current = event.stream;
          
          // Check if the stream has video tracks
          const videoTracks = event.stream.getVideoTracks();
          const hasActiveVideo = videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState !== 'ended';
          setIsRemoteCameraOn(hasActiveVideo);
          console.log('Remote camera status on stream received:', hasActiveVideo, 'tracks:', videoTracks.length);
          
          // Listen for track events on the stream
          event.stream.addEventListener('removetrack', (e: any) => {
            console.log('Remote track removed:', e.track.kind);
            if (e.track.kind === 'video') {
              console.log('Remote video track removed - setting camera off');
              setIsRemoteCameraOn(false);
            }
          });
          
          event.stream.addEventListener('addtrack', (e: any) => {
            console.log('Remote track added:', e.track.kind);
            if (e.track.kind === 'video') {
              console.log('Remote video track added - setting camera on');
              setIsRemoteCameraOn(true);
            }
          });
          
          // Also listen for track state changes on individual video tracks
          videoTracks.forEach((track: any) => {
            track.addEventListener('ended', () => {
              console.log('Remote video track ended - setting camera off');
              setIsRemoteCameraOn(false);
            });
            
            track.addEventListener('mute', () => {
              console.log('Remote video track muted - setting camera off');
              setIsRemoteCameraOn(false);
            });
            
            track.addEventListener('unmute', () => {
              console.log('Remote video track unmuted - setting camera on');
              setIsRemoteCameraOn(true);
            });
          });
          
          setIsInCall(true);
          setIsConnected(true);
          setConnectionStatus("in-call");
          setStatusMessage("Connected!");
          setStatus("Connected!");
          setError("");
        }
      };

      // Handle ICE candidates
      (peerConnection as any).onicecandidate = (event: any) => {
        if (event.candidate && wsRef.current) {
          console.log('Sending ICE candidate');
          wsRef.current.send(
            JSON.stringify({
              event: "webrtc-ice-candidate",
              data: { candidate: event.candidate },
            })
          );
        }
      };

      if (isInitiator) {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConnection.setLocalDescription(offer);

        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              event: "webrtc-offer",
              data: { offer },
            })
          );
        }
      }
    } catch (error) {
      console.error("Error initializing call:", error);
      setError("Failed to start video call. Please try again.");
    }
  };

  const handleWebRTCOffer = async (data: any) => {
    try {
      if (!peerConnectionRef.current) return;

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            event: "webrtc-answer",
            data: { answer },
          })
        );
      }
    } catch (error) {
      console.error("Error handling WebRTC offer:", error);
      setError("Connection issue. Please try reconnecting.");
    }
  };

  const handleWebRTCAnswer = async (data: any) => {
    try {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error("Error handling WebRTC answer:", error);
      setError("Connection issue. Please try reconnecting.");
    }
  };

  const handleWebRTCIceCandidate = async (data: any) => {
    try {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  };

  const handlePartnerLeft = () => {
    setStatusMessage("Partner left the call");
    setStatus("Partner left the call");
    setIsInCall(false);
    setIsConnected(false);
    setIsLocalVideoLarge(false); // Reset video toggle to normal
    setConnectionStatus("connected");

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    remoteStreamRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setIsCameraOn(true);
    setIsMicOn(true);
    setIsProcessing(false);
    setIsSearching(false);

    setRoomId(null);
    setPartnerId(null);
    setRole(null);
  };

  const handleCallEnded = () => {
    setStatusMessage("Call ended");
    setStatus("Call ended");
    setIsInCall(false);
    setIsConnected(false);
    setIsLocalVideoLarge(false); // Reset video toggle to normal
    setConnectionStatus("connected");

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    remoteStreamRef.current = null;

    setIsCameraOn(true);
    setIsMicOn(true);
    setIsProcessing(false);
    setIsSearching(false);

    setRoomId(null);
    setPartnerId(null);
    setRole(null);
  };

  const handleConnectToServer = async () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 1500);
    
    await connectToServer();
  };

  const handleFindMatch = async () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 1500);
    
    findMatch();
  };

  const findMatch = async () => {
    if (!wsRef.current || connectionStatus !== "connected" || isProcessing) {
      if (connectionStatus !== "connected") {
        setError("Please connect to the server first");
      } else if (isProcessing) {
        setError("Please wait, processing your request...");
      }
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Clean up any existing stream first
      if (localStreamRef.current) {
        console.log('Cleaning up existing stream before creating new one');
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Request permissions first
      const hasPermissions = await requestCameraAndMicrophonePermissions();
      if (!hasPermissions) {
        setIsProcessing(false);
        return;
      }

      // Setup audio routing for video calls
      console.log('Setting up audio routing...');
      const audioSetupSuccess = await setupAudioForVideoCall();
      if (audioSetupSuccess) {
        console.log('Audio setup successful, current device:', currentDevice);
      } else {
        console.warn('Audio setup failed, continuing with default settings');
      }

      console.log('Creating media stream with camera facing:', cameraFacing);
      const stream = await mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          frameRate: 30,
          facingMode: cameraFacing,
        },
        audio: true,
      });

      localStreamRef.current = stream;
      console.log('Media stream created successfully');

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        videoTrack.enabled = isCameraOn;
        console.log('Video track enabled:', isCameraOn);
      }

      if (audioTrack) {
        audioTrack.enabled = isMicOn;
        console.log('Audio track enabled:', isMicOn);
      }

      wsRef.current.send(JSON.stringify({ event: "find-match" }));

      setConnectionStatus("searching");
      setStatusMessage("Getting ready...");
      setStatus("Getting ready...");
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setError("Unable to access camera/microphone. Please grant permissions and try again.");
      setIsProcessing(false);
      
      // Clean up on error
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      Alert.alert(
        "Permission Required",
        "Please grant camera and microphone permissions to use video chat.",
        [{ text: "OK" }]
      );
    }
  };

  const handleCancelSearch = () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 1000);
    
    cancelSearch();
  };

  const cancelSearch = () => {
    if (!wsRef.current) return;

    console.log('Cancelling search and cleaning up stream');
    wsRef.current.send(JSON.stringify({ event: "cancel-search" }));

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Reset states
    setIsSearching(false);
    setStatus("Ready");
    setIsProcessing(false);
    
    // Reset camera state but keep user preferences
    // Don't reset isCameraOn and cameraFacing as user might want to keep their settings
    console.log('Search cancelled, stream cleaned up');
  };

  const handleDisconnect = () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    setTimeout(() => setIsButtonDisabled(false), 1000);
    
    if (isInCall) {
      leaveCall();
    } else {
      disconnect();
    }
  };

  const leaveCall = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ event: "leave-call" }));
    }
    handleCallEnded();
  };

  const disconnect = () => {
    cleanup();
    setConnectionStatus("disconnected");
    setStatusMessage("");
    setError("");
  };

  const toggleCamera = async () => {
    console.log('Toggle camera called, current state:', isCameraOn, 'has stream:', !!localStreamRef.current, 'has peer:', !!peerConnectionRef.current);
    
    if (localStreamRef.current && peerConnectionRef.current) {
      // In call - full WebRTC handling
      if (isCameraOn) {
        // Turning camera OFF - stop and remove the video track
        console.log('Turning camera OFF in call');
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
        }
        
        // Find the video sender and remove the track
        const videoSender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (videoSender) {
          try {
            await videoSender.replaceTrack(null);
            console.log('Successfully replaced video track with null');
          } catch (error) {
            console.log('Could not replace track with null:', error);
            peerConnectionRef.current.removeTrack(videoSender);
          }
        }
        
        setIsCameraOn(false);
        console.log('Camera turned OFF in call');
      } else {
        // Turning camera ON in call
        console.log('Turning camera ON in call');
        try {
          const newStream = await mediaDevices.getUserMedia({
            video: {
              width: 1280,
              height: 720,
              frameRate: 30,
              facingMode: cameraFacing,
            },
            audio: false,
          });
          
          const newVideoTrack = newStream.getVideoTracks()[0];
          if (newVideoTrack) {
            newVideoTrack.enabled = true;
            localStreamRef.current.addTrack(newVideoTrack);
            
            // Add track to peer connection
            const existingVideoSender = peerConnectionRef.current.getSenders().find(s => 
              s.track === null || (s.track && s.track.kind === 'video')
            );
            
            if (existingVideoSender) {
              await existingVideoSender.replaceTrack(newVideoTrack);
              console.log('Replaced null track with new video track');
            } else {
              peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current);
              console.log('Added new video track to peer connection');
            }
            
            setIsCameraOn(true);
            console.log('Camera turned ON in call');
          }
        } catch (error) {
          console.error('Error turning camera on in call:', error);
          setError('Unable to turn on camera. Please try again.');
        }
      }
    } else if (localStreamRef.current) {
      // During search - simpler track enable/disable
      console.log('Toggling camera during search/preparation');
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      if (isCameraOn) {
        // Turn OFF - just disable the track
        console.log('Disabling video track during search');
        if (videoTrack) {
          videoTrack.enabled = false;
        }
        setIsCameraOn(false);
      } else {
        // Turn ON - enable existing track or create new one
        if (videoTrack && videoTrack.readyState !== 'ended') {
          console.log('Enabling existing video track during search');
          videoTrack.enabled = true;
          setIsCameraOn(true);
        } else {
          // Need to create a new video track
          console.log('Creating new video track during search');
          try {
            // Stop the old track if it exists
            if (videoTrack) {
              videoTrack.stop();
              localStreamRef.current.removeTrack(videoTrack);
            }
            
            const newVideoStream = await mediaDevices.getUserMedia({
              video: {
                width: 1280,
                height: 720,
                frameRate: 30,
                facingMode: cameraFacing,
              },
              audio: false,
            });
            
            const newVideoTrack = newVideoStream.getVideoTracks()[0];
            if (newVideoTrack) {
              newVideoTrack.enabled = true;
              localStreamRef.current.addTrack(newVideoTrack);
              setIsCameraOn(true);
              console.log('Added new video track during search');
            }
          } catch (error) {
            console.error('Error creating video track during search:', error);
            setError('Unable to turn on camera. Please try again.');
          }
        }
      }
    } else {
      // No stream - just toggle state
      console.log('No stream available, just toggling state');
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    } else {
      setIsMicOn(!isMicOn);
    }
  };

  const flipCamera = async () => {
    if (!localStreamRef.current) {
      console.log('No local stream available for camera flip');
      return;
    }

    try {
      console.log('Flipping camera from', cameraFacing, 'to', cameraFacing === 'user' ? 'environment' : 'user');
      
      // Store the current audio track before we modify the stream
      const currentAudioTrack = localStreamRef.current.getAudioTracks()[0];
      
      // Stop and remove current video track
      const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (currentVideoTrack) {
        currentVideoTrack.stop();
        localStreamRef.current.removeTrack(currentVideoTrack);
        console.log('Stopped and removed current video track');
      }

      // Toggle camera facing
      const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
      
      // Get new video stream with different camera
      const newVideoStream = await mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          frameRate: 30,
          facingMode: newFacing,
        },
        audio: false, // Don't get audio, we'll reuse existing
      });

      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      
      if (newVideoTrack) {
        // Set the video track state based on current camera setting
        newVideoTrack.enabled = isCameraOn;
        
        // Add the new video track to our existing stream
        localStreamRef.current.addTrack(newVideoTrack);
        
        console.log('Added new video track with facing:', newFacing, 'enabled:', isCameraOn);
        
        // Update camera facing state only after successful track replacement
        setCameraFacing(newFacing);
        
        // Force video re-render to show the new camera immediately
        setVideoKey(prev => prev + 1);
        
        // Update peer connection if in call
        if (peerConnectionRef.current && isInCall) {
          const videoSender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (videoSender) {
            await videoSender.replaceTrack(newVideoTrack);
            console.log('Updated video track in peer connection');
          }
        }
        
        console.log('Camera flip completed successfully - preview should update');
      } else {
        throw new Error('Failed to get new video track');
      }

    } catch (error) {
      console.error('Error flipping camera:', error);
      setError('Unable to switch camera. Please try again.');
      
      // If flip failed, try to restore a working video track with current facing
      try {
        console.log('Attempting to restore video track...');
        const restoreStream = await mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            frameRate: 30,
            facingMode: cameraFacing, // Use current facing, don't change
          },
          audio: false,
        });
        
        const restoreVideoTrack = restoreStream.getVideoTracks()[0];
        if (restoreVideoTrack) {
          restoreVideoTrack.enabled = isCameraOn;
          localStreamRef.current?.addTrack(restoreVideoTrack);
          console.log('Restored video track successfully');
        }
      } catch (restoreError) {
        console.error('Failed to restore video track:', restoreError);
        // If restoration also fails, recreate the entire stream
        try {
          await recreateStream();
        } catch (recreateError) {
          console.error('Failed to recreate stream:', recreateError);
        }
      }
    }
  };

  // Helper function to recreate the entire stream when things go wrong
  const recreateStream = async () => {
    console.log('Recreating entire stream...');
    
    // Stop all tracks from current stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Create a new stream
    try {
      const newStream = await mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          frameRate: 30,
          facingMode: cameraFacing,
        },
        audio: true,
      });
      
      // Set track states
      const videoTrack = newStream.getVideoTracks()[0];
      const audioTrack = newStream.getAudioTracks()[0];
      
      if (videoTrack) {
        videoTrack.enabled = isCameraOn;
      }
      if (audioTrack) {
        audioTrack.enabled = isMicOn;
      }
      
      localStreamRef.current = newStream;
      console.log('Stream recreated successfully');
      
      // Update peer connection if in call
      if (peerConnectionRef.current && isInCall) {
        // Replace all tracks in peer connection
        const senders = peerConnectionRef.current.getSenders();
        
        for (const sender of senders) {
          if (sender.track) {
            const newTrack = newStream.getTracks().find(track => track.kind === sender.track?.kind);
            if (newTrack) {
              await sender.replaceTrack(newTrack);
            }
          }
        }
        console.log('Updated all tracks in peer connection');
      }
      
    } catch (error) {
      console.error('Failed to recreate stream:', error);
      setError('Camera issue. Please restart the app.');
    }
  };

  // Audio device helper functions
  const getAudioDeviceIcon = (device: string | null) => {
    switch (device) {
      case 'BLUETOOTH': return 'bluetooth';
      case 'WIRED_HEADSET': return 'headset';
      case 'SPEAKER': return 'volume-high';
      case 'EARPIECE': return 'call';
      default: return 'volume-high';
    }
  };

  const getAudioDeviceLabel = (device: string) => {
    switch (device) {
      case 'BLUETOOTH': return 'Bluetooth';
      case 'WIRED_HEADSET': return 'Headset';
      case 'SPEAKER': return 'Speaker';
      case 'EARPIECE': return 'Phone';
      default: return device;
    }
  };

  const showAudioDeviceOptions = () => {
    if (availableDevices.length <= 1) return;

    const options = availableDevices.map(device => ({
      text: getAudioDeviceLabel(device),
      onPress: () => switchAudioDevice(device),
    }));

    options.push({
      text: 'Cancel',
      onPress: async () => {},
    });

    Alert.alert(
      'Audio Output',
      'Choose your audio output device',
      options,
      { cancelable: true }
    );
  };

  const switchAudioDevice = async (device: string) => {
    try {
      let success = false;
      switch (device) {
        case 'SPEAKER':
          success = await switchToSpeaker();
          break;
        case 'EARPIECE':
          success = await switchToEarpiece();
          break;
        case 'BLUETOOTH':
          success = await switchToBluetooth();
          break;
        default:
          console.warn('Unknown audio device:', device);
      }

      if (success) {
        console.log('Successfully switched to audio device:', device);
      } else {
        console.error('Failed to switch to audio device:', device);
      }
    } catch (error) {
      console.error('Error switching audio device:', error);
    }
  };

  // Handle double tap to switch video views
  const handleDoubleTap = () => {
    if (isInCall) {
      setIsLocalVideoLarge(!isLocalVideoLarge);
    }
  };

  // Double tap gesture handling
  const lastTap = useRef<number>(0);
  const handleLocalVideoTouch = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      handleDoubleTap();
    } else {
      lastTap.current = now;
    }
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
        {/* Main Video (Remote or Local based on toggle) */}
        <View style={styles.remoteVideo}>
          {isLocalVideoLarge ? (
            // Show local video in main area when toggled
            localStreamRef.current ? (
              <RTCView
                key={`local-main-${videoKey}`}
                style={styles.remoteVideoView}
                streamURL={localStreamRef.current.toURL()}
                objectFit="cover"
                mirror={true}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <View style={styles.placeholderBackground} />
                <>
                  <Ionicons name="videocam" size={48} color="#10B981" />
                  <Text style={styles.placeholderText}>Your Video</Text>
                </>
              </View>
            )
          ) : (
            // Show remote video in main area (default)
            remoteStreamRef.current ? (
              isRemoteCameraOn ? (
                <RTCView
                  style={styles.remoteVideoView}
                  streamURL={remoteStreamRef.current.toURL()}
                  objectFit="cover"
                  mirror={false}
                />
              ) : (
                <View style={styles.noVideoContainer}>
                  <View style={styles.placeholderBackground} />
                  <Ionicons name="videocam-off" size={60} color="#6b7280" />
                  <Text style={styles.noVideoText}>Stranger turned off camera</Text>
                </View>
              )
            ) : (
              <View style={styles.videoPlaceholder}>
                {/* Background gradient effect */}
                <View style={styles.placeholderBackground} />
                {isSearching ? (
                  <>
                    <ActivityIndicator size="large" color="#34D399" />
                    <Text style={styles.searchingVideoText}>Searching for a match...</Text>
                  </>
                ) : connectionStatus === "matched" ? (
                  <>
                    <ActivityIndicator size="large" color="#34D399" />
                    <Text style={styles.searchingVideoText}>Connecting...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="videocam-outline" size={64} color="#64748B" />
                    <Text style={styles.placeholderText}>
                      {connectionStatus === "disconnected" 
                        ? "Press CONNECT to start" 
                        : connectionStatus === "connected"
                        ? "Press FIND MATCH to search"
                        : "Waiting for stranger..."}
                    </Text>
                  </>
                )}
              </View>
            )
          )}
        </View>
        
        {/* Small Video (Local or Remote based on toggle) */}
        <Animated.View 
          style={[
            styles.localVideo,
            {
              transform: localVideoPosition.getTranslateTransform(),
            }
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback onPress={handleLocalVideoTouch}>
            <View style={styles.localVideoTouchArea}>
              {isLocalVideoLarge ? (
                // Show remote video in small area when toggled
                remoteStreamRef.current ? (
                  isRemoteCameraOn ? (
                    <>
                      <RTCView
                        style={styles.localVideoView}
                        streamURL={remoteStreamRef.current.toURL()}
                        objectFit="cover"
                        mirror={false}
                        zOrder={1}
                      />
                      <View style={styles.smallVideoIndicator}>
                        <Text style={styles.smallVideoIndicatorText}>Stranger</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[styles.localVideoView, styles.noVideoSmallContainer]}>
                        <Ionicons name="videocam-off" size={20} color="#6b7280" />
                      </View>
                      <View style={styles.smallVideoIndicator}>
                        <Text style={styles.smallVideoIndicatorText}>Stranger</Text>
                      </View>
                    </>
                  )
                ) : (
                  <View style={styles.localVideoPlaceholder}>
                    <Ionicons name="person" size={24} color="#9CA3AF" />
                    <Text style={styles.selfTextOff}>Stranger</Text>
                  </View>
                )
              ) : (
                // Show local video in small area (default)
                localStreamRef.current && isCameraOn ? (
                  <>
                    <RTCView
                      key={`local-small-${videoKey}`}
                      style={styles.localVideoView}
                      streamURL={localStreamRef.current.toURL()}
                      objectFit="cover"
                      mirror={true}
                      zOrder={1}
                    />
                    <View style={styles.smallVideoIndicator}>
                      <Text style={styles.smallVideoIndicatorText}>You</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.localVideoPlaceholder}>
                    {isCameraOn ? (
                      localStreamRef.current ? (
                        <>
                          <Ionicons name="videocam" size={20} color="#10B981" />
                          <Text style={styles.selfText}>You</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="videocam" size={20} color="#10B981" />
                          <Text style={styles.selfText}>You</Text>
                        </>
                      )
                    ) : (
                      <>
                        <Ionicons name="videocam-off" size={20} color="#9CA3AF" />
                        <Text style={styles.selfTextOff}>Camera Off</Text>
                      </>
                    )}
                  </View>
                )
              )}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
        
        {/* Call Duration Display */}
        {isInCall && (
          <View style={styles.callDurationContainer}>
            <Text style={styles.callDurationText}>
              {formatCallDuration(callDuration)}
            </Text>
          </View>
        )}
      </View>

      {/* Control Panel - Fixed at bottom, absolute positioned */}
      {isInCall ? (
        <View style={styles.inCallControlContainer}>
          <View style={styles.controlPanel}>
            {/* Camera Toggle */}
            <TouchableOpacity
              style={[styles.controlButton, styles.roundButton]}
              onPress={toggleCamera}
              activeOpacity={0.8}>
              <Ionicons 
                name={isCameraOn ? "videocam" : "videocam-off"} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>

            {/* Mic Toggle */}
            <TouchableOpacity
              style={[styles.controlButton, styles.roundButton]}
              onPress={toggleMic}
              activeOpacity={0.8}>
              <Ionicons 
                name={isMicOn ? "mic" : "mic-off"} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>

            {/* Camera Flip Button - Only show when camera is on */}
            {isCameraOn && (
              <TouchableOpacity
                style={[styles.controlButton, styles.roundButton]}
                onPress={flipCamera}
                activeOpacity={0.8}>
                <Ionicons 
                  name="camera-reverse" 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            )}

            {/* End Call Button */}
            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleDisconnect}
              activeOpacity={0.8}>
              <Ionicons 
                name="call" 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.regularControlPanel}>
          {/* Control Buttons Row */}
          <View style={styles.controlRow}>
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

            {/* Connect/Find/Disconnect Button */}
            <TouchableOpacity
              style={[
                styles.mainButton, 
                isSearching || isConnected ? styles.disconnectButton : styles.findButton,
                isButtonDisabled && styles.disabledButton
              ]}
              onPress={
                connectionStatus === "disconnected" ? handleConnectToServer :
                connectionStatus === "connected" ? handleFindMatch :
                isSearching ? handleCancelSearch : 
                isConnected ? handleDisconnect : 
                handleConnectToServer
              }
              disabled={isButtonDisabled || isProcessing}
              activeOpacity={0.8}>
              <Ionicons 
                name={
                  connectionStatus === "disconnected" ? "link" :
                  connectionStatus === "connected" ? "search" :
                  isSearching ? "close" :
                  isConnected ? "stop" :
                  "link"
                } 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={[
                styles.mainButtonText,
                isButtonDisabled && styles.disabledButtonText
              ]}>
                {connectionStatus === "disconnected" ? 'CONNECT' :
                 connectionStatus === "connected" ? 'FIND MATCH' :
                 isSearching ? 'CANCEL' :
                 isConnected ? 'DISCONNECT' :
                 'CONNECT'}
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

          {/* Secondary Controls Row - Only show when relevant */}
          {(isCameraOn || (isInCall && isAudioSetup && availableDevices.length > 1)) && (
            <View style={styles.secondaryControlRow}>
              {/* Camera Flip Button - Only show when camera is on and we have a stream */}
              {isCameraOn && localStreamRef.current && (
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.activeControl]}
                  onPress={flipCamera}
                  activeOpacity={0.8}>
                  <Ionicons 
                    name="camera-reverse" 
                    size={18} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.secondaryButtonText}>Flip</Text>
                </TouchableOpacity>
              )}

              {/* Audio Device Selector - Only show when in call and audio is setup */}
              {isInCall && isAudioSetup && availableDevices.length > 1 && (
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.audioDeviceButton]}
                  onPress={showAudioDeviceOptions}
                  activeOpacity={0.8}>
                  <Ionicons 
                    name={getAudioDeviceIcon(currentDevice)} 
                    size={18} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.secondaryButtonText}>Audio</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Status Message - Only when not in call and there's an error */}
      {!isInCall && error && (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}
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
    backgroundColor: '#1E293B',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  remoteVideoView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  placeholderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1E293B',
    opacity: 0.8,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    zIndex: 1,
  },
  searchingVideoText: {
    color: '#6EE7B7',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    zIndex: 1,
  },
  localVideo: {
    position: 'absolute',
    width: 100,
    height: 140,
    backgroundColor: '#FF0000', 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#10B981',
    zIndex: 9999,
  },
  localVideoView: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
    height: '100%',
  },
  localVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    pointerEvents: 'none',
  },
  localVideoBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: -1,
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  localVideoIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  localVideoIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  noVideoText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
    zIndex: 1,
  },
  noVideoSmallContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  callDurationContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callDurationText: {
    color: '#F0FDF4',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  controlPanelContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inCallControlContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  controlPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 40,
    gap: 30,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  roundButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  endCallButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.7)',
  },
  regularControlPanel: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 211, 153, 0.2)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  secondaryControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    gap: 20,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  localVideoTouchArea: {
    flex: 1,
    position: 'relative',
  },
  smallVideoIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallVideoIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeControl: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
    borderWidth: 2,
  },
  inactiveControl: {
    backgroundColor: '#334155',
    borderColor: '#64748B',
    borderWidth: 2,
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
  errorText: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  audioDeviceButton: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  // Self video placeholder styles
  selfText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  selfTextOff: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
});
