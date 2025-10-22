"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react"

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
  Easing,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { Header } from "../components/Header"
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
  type MediaStream,
} from "react-native-webrtc"
import config, { ICE_SERVERS } from "../config/config"
import { requestCameraAndMicrophonePermissions } from "../utils/permissions"
import { getVideoToken } from "../utils/videoToken"
import { useAudioManager } from "../utils/useAudioManager"
import KeepAwake from "react-native-keep-awake"
import type RTCDataChannel from "react-native-webrtc/lib/typescript/RTCDataChannel"
import { BackHandler } from "react-native"
import ConnectionManager from "../utils/ConnectionManager"

const { width, height } = Dimensions.get("window")

const WEBSOCKET_URL = config.videoUrl
const CONNECTION_ID = "video_chat"

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "searching" | "matched" | "in-call"

// Atomic operation types
type AtomicOperation = 'skip' | 'connect' | 'disconnect' | 'find_match' | 'leave_call';

interface OperationLock {
  operation: AtomicOperation;
  timestamp: number;
  promise: Promise<void>;
}

export interface VideoChatScreenRef {
  disconnect: () => void
  reconnect: () => void
}

interface VideoChatScreenProps {
  onMenuPress?: () => void
  onChatStatusChange?: (isConnected: boolean) => void
  shouldAutoConnect?: boolean
  shouldDisconnectOnTabSwitch?: boolean
}

export const VideoChatScreen = forwardRef<VideoChatScreenRef, VideoChatScreenProps>(
  ({ onMenuPress, onChatStatusChange, shouldAutoConnect = false, shouldDisconnectOnTabSwitch = false }, ref) => {
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
    } = useAudioManager()

    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
    const [statusMessage, setStatusMessage] = useState("")
    const [error, setError] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [onlineUsers, setOnlineUsers] = useState(0)
    const [status, setStatus] = useState("Ready")
    const [isCameraOn, setIsCameraOn] = useState(true)
    const [isMicOn, setIsMicOn] = useState(true)
    const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user")
    const [isButtonDisabled, setIsButtonDisabled] = useState(false)
    const [isInCall, setIsInCall] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isLocalVideoLarge, setIsLocalVideoLarge] = useState(false)
    const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(true)
    const [isRemoteMicOn, setIsRemoteMicOn] = useState(true)
    const dataChannelRef = useRef<RTCDataChannel | null>(null)
    const [videoKey, setVideoKey] = useState(0)

    // Animation refs
    const pulseAnim = useRef(new Animated.Value(1)).current
    const rotateAnim = useRef(new Animated.Value(0)).current
    const scaleAnim = useRef(new Animated.Value(0)).current
    const fadeAnim = useRef(new Animated.Value(0)).current
    const glowAnim = useRef(new Animated.Value(0)).current

    // Draggable local video position - start in top right
    const localVideoPosition = useRef(new Animated.ValueXY({ x: width - 130, y: 20 })).current

    // WebRTC and signaling refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const remoteStreamRef = useRef<MediaStream | null>(null)
    const callTimerRef = useRef<NodeJS.Timeout | null>(null)
    const shouldAutoSearchNextRef = useRef(false)
    const backgroundStreamRef = useRef<MediaStream | null>(null)

    // Call state
    const [callDuration, setCallDuration] = useState(0)
    const [roomId, setRoomId] = useState<string | null>(null)
    const [partnerId, setPartnerId] = useState<string | null>(null)
    const [role, setRole] = useState<"caller" | "callee" | null>(null)

    // Connection Manager
    const connectionManager = useRef(ConnectionManager.getInstance())

    // Atomic operation lock
    const operationLock = useRef<OperationLock | null>(null)

    // Atomic operation wrapper
    const executeAtomicOperation = useCallback(async <T>(
      operation: AtomicOperation,
      fn: () => Promise<T>
    ): Promise<T | null> => {
      // Check if there's an ongoing operation
      if (operationLock.current) {
        const currentOp = operationLock.current;
        const timeSinceStart = Date.now() - currentOp.timestamp;
        
        // If operation is too old (>5s), force clear it
        if (timeSinceStart > 5000) {
          console.warn(`🔓 Force clearing stale operation: ${currentOp.operation}`);
          operationLock.current = null;
        } else {
          console.log(`⏳ Operation ${operation} blocked by ongoing ${currentOp.operation}`);
          // Wait for current operation to complete
          try {
            await currentOp.promise;
          } catch (error) {
            console.error(`❌ Previous operation ${currentOp.operation} failed:`, error);
          }
        }
      }

      // Create new operation lock
      const promise = (async () => {
        try {
          console.log(`🔒 Starting atomic operation: ${operation}`);
          const result = await fn();
          console.log(`✅ Completed atomic operation: ${operation}`);
          return result;
        } catch (error) {
          console.error(`❌ Failed atomic operation: ${operation}`, error);
          throw error;
        } finally {
          operationLock.current = null;
        }
      })();

      operationLock.current = {
        operation,
        timestamp: Date.now(),
        promise: promise.then(() => {}, () => {}) // Convert to void promise
      };

      return promise;
    }, []);

    // Memoized connection options
    const connectionOptions = useRef({
      wsUrl: '',
      onOpen: () => {
        console.log("🎯 Connected to video chat server via ConnectionManager")
        setConnectionStatus("connected")
        setStatusMessage("Connected to server")
        setIsConnected(false)
        setError("")
      },
      onMessage: async (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data)
          await handleServerMessage(message)
        } catch (error) {
          console.error("Error parsing server message:", error)
        }
      },
      onClose: () => {
        console.log("🔌 Disconnected from video chat server")
        setConnectionStatus("disconnected")
        setStatusMessage("Disconnected from server")
        setIsConnected(false)
      },
      onError: (error: Event) => {
        console.error("WebSocket error:", error)
        setError("Connection lost. Please check your internet and try reconnecting.")
        setConnectionStatus("disconnected")
        setIsConnected(false)
      }
    });

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      disconnect: () => executeAtomicOperation('disconnect', handleDisconnect),
      reconnect: () => executeAtomicOperation('connect', handleReconnect),
    }))

    // Effect for handling side-panel state
    useEffect(() => {
      onChatStatusChange?.(isInCall)
    }, [isInCall, onChatStatusChange])

    // Effect for tab switch disconnection
    useEffect(() => {
      if (shouldDisconnectOnTabSwitch && connectionStatus !== "disconnected") {
        console.log("Auto-disconnecting from video server due to tab switch...")
        executeAtomicOperation('disconnect', handleDisconnect)
      }
    }, [shouldDisconnectOnTabSwitch, connectionStatus])

    // Effect for auto-connection
    useEffect(() => {
      if (
        shouldAutoConnect &&
        connectionStatus === "disconnected" &&
        !connectionManager.current.isConnected(CONNECTION_ID)
      ) {
        if (connectionStatus === "disconnected" && !operationLock.current) {
          executeAtomicOperation('connect', handleAutoConnect)
        }
      }
    }, [shouldAutoConnect, connectionStatus])

    // Effect for background camera preview
    useEffect(() => {
      if (connectionStatus === "disconnected") {
        startBackgroundCameraPreview()
      }
      return () => {
        if (backgroundStreamRef.current) {
          backgroundStreamRef.current.getTracks().forEach(track => track.stop())
          backgroundStreamRef.current = null
        }
      }
    }, [connectionStatus])

    // Auto-search effect after call ends
    useEffect(() => {
      if (
        shouldAutoSearchNextRef.current &&
        !isInCall &&
        connectionStatus === "connected" &&
        connectionManager.current.isConnected(CONNECTION_ID) &&
        !isProcessing &&
        !isSearching
      ) {
        executeAtomicOperation('find_match', handleFindMatchInternal)
        shouldAutoSearchNextRef.current = false
      }
    }, [isInCall, connectionStatus, isProcessing, isSearching])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        console.log("🧹 Cleaning up VideoChatScreen...")
        cleanup()
      }
    }, [])

    // Helper functions
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const cleanup = () => {
      // Clear operation lock
      operationLock.current = null;

      // Close connection via manager
      connectionManager.current.closeConnection(CONNECTION_ID);

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      if (backgroundStreamRef.current) {
        backgroundStreamRef.current.getTracks().forEach((track) => track.stop())
        backgroundStreamRef.current = null
      }

      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }
      setCallDuration(0)

      if (isAudioSetup) {
        restoreAudioSettings().catch(console.error)
      }

      KeepAwake.deactivate()

      setIsCameraOn(true)
      setIsMicOn(true)
      setIsInCall(false)
      setIsProcessing(false)
      setIsLocalVideoLarge(false)
      setConnectionStatus("disconnected")
      setStatusMessage("")
      setError("")
      setRoomId(null)
      setPartnerId(null)
      setRole(null)
      setIsConnected(false)
      setIsSearching(false)
      setStatus("Ready")
    }

    const startBackgroundCameraPreview = async () => {
      try {
        if (backgroundStreamRef.current) {
          return; // Already have background stream
        }

        const hasPermissions = await requestCameraAndMicrophonePermissions()
        if (!hasPermissions) {
          console.log("No camera permissions for background preview")
          return
        }

        const stream = await mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: cameraFacing,
            frameRate: { ideal: 15 } // Lower framerate for background preview
          },
          audio: false, // No audio for background preview
        })

        backgroundStreamRef.current = stream
        console.log("📹 Background camera preview started")
      } catch (error) {
        console.error("Failed to start background camera preview:", error)
      }
    }

    const handleAutoConnect = async (): Promise<void> => {
      try {
        setConnectionStatus("connecting")
        setStatusMessage("Getting authorization...")
        setError("")

        console.log("🔄 Auto-connecting to video chat server...")

        const { token, signature, expiresAt } = await getVideoToken()
        setStatusMessage("Connecting to server...")

        const wsUrl = `${WEBSOCKET_URL}?token=${token}&signature=${signature}&expiresAt=${expiresAt}`
        connectionOptions.current.wsUrl = wsUrl;

        await connectionManager.current.getOrCreateConnection(CONNECTION_ID, connectionOptions.current)
      } catch (error) {
        console.error("Error auto-connecting to server:", error)
        handleConnectionError(error)
      }
    }

    const handleReconnect = async (): Promise<void> => {
      return handleAutoConnect();
    }

    const handleDisconnect = async (): Promise<void> => {
      cleanup()
    }

    const handleConnectionError = (error: any) => {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      if (errorMessage.includes("Rate limit exceeded")) {
        const retryMatch = errorMessage.match(/Try again in (\d+) seconds/)
        if (retryMatch) {
          const retryAfter = parseInt(retryMatch[1])
          setError(`Rate limit exceeded. Try again in ${retryAfter} seconds.`)
          setStatusMessage(`Rate limited. Retry in ${retryAfter}s`)
        } else {
          setError("Rate limit exceeded. Please wait before trying again.")
          setStatusMessage("Rate limited")
        }
      } else {
        setError("Can't connect to our servers. Please check your internet connection and try again.")
        setStatusMessage("Connection failed")
      }

      setConnectionStatus("disconnected")
      setIsConnected(false)
    }

    const handleServerMessage = async (message: any) => {
      const { event, data } = message

      switch (event) {
        case "connected":
          break

        case "searching":
          setConnectionStatus("searching")
          setStatusMessage("Searching for a match...")
          setStatus("Searching for a match...")
          setIsSearching(true)
          setError("")
          setIsProcessing(false)
          break

        case "search-canceled":
          setConnectionStatus("connected")
          setStatusMessage("Search canceled")
          setStatus("Ready")
          setIsSearching(false)
          setError("")
          break

        case "match-found":
          setConnectionStatus("matched")
          setStatusMessage("Match found! Preparing video call...")
          setStatus("Match found! Connecting...")
          setIsSearching(false)
          setError("")
          setRoomId(data.roomId)
          setPartnerId(data.partnerId)
          setRole(data.role)
          await initializeCall(data.role === "caller")
          break

        case "webrtc-offer":
          await handleWebRTCOffer(data)
          break

        case "webrtc-answer":
          await handleWebRTCAnswer(data)
          break

        case "webrtc-ice-candidate":
          await handleWebRTCIceCandidate(data)
          break

        case "partner-left":
        case "partner-disconnected":
          handlePartnerLeft()
          break

        case "call-ended":
          handleCallEnded()
          break

        case "error":
          const serverError = data.message || "Unknown error"
          if (serverError.includes("Rate limit") || serverError.includes("rate limit")) {
            const retryMatch = serverError.match(/(\d+)\s*seconds?/)
            const retryAfter = retryMatch ? parseInt(retryMatch[1]) : 60
            setError(`Rate limit exceeded. Try again in ${retryAfter} seconds.`)
            setStatusMessage(`Rate limited. Retry in ${retryAfter}s`)
          } else {
            setError(serverError)
            setStatusMessage("Error occurred")
          }
          setIsProcessing(false)
          setIsSearching(false)
          break

        case "online-count":
          setOnlineUsers(data.count || 0)
          break

        case "pong":
          // Handle heartbeat response
          break

        default:
          console.log("Unknown event:", event, data)
      }
    }

    const initializeCall = async (isCaller: boolean) => {
      try {
        console.log(`🎬 Initializing call as ${isCaller ? "caller" : "callee"}`)

        // Ensure we have proper video stream
        await ensureVideoStream()

        // Setup audio for call
        if (!isAudioSetup) {
          await setupAudioForVideoCall()
        }

        // Create peer connection
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
        peerConnectionRef.current = pc

        // Add local stream to peer connection
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            if (localStreamRef.current) {
              pc.addTrack(track, localStreamRef.current)
            }
          })
        }

        // Handle ice candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && connectionManager.current.isConnected(CONNECTION_ID)) {
            connectionManager.current.sendMessage(CONNECTION_ID, {
              event: "webrtc-ice-candidate",
              data: { candidate: event.candidate }
            })
          }
        }

        // Handle remote stream
        pc.ontrack = (event) => {
          console.log("📺 Received remote stream")
          remoteStreamRef.current = event.streams[0]
          setVideoKey(prev => prev + 1) // Force re-render
        }

        // Create data channel for status updates
        if (isCaller) {
          const dataChannel = pc.createDataChannel("status", { ordered: true })
          dataChannelRef.current = dataChannel

          dataChannel.onopen = () => console.log("Data channel opened")
          dataChannel.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              handleDataChannelMessage(data)
            } catch (error) {
              console.error("Error parsing data channel message:", error)
            }
          }
        }

        // Handle incoming data channel
        pc.ondatachannel = (event) => {
          const dataChannel = event.channel
          dataChannelRef.current = dataChannel

          dataChannel.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              handleDataChannelMessage(data)
            } catch (error) {
              console.error("Error parsing data channel message:", error)
            }
          }
        }

        if (isCaller) {
          // Create and send offer
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)

          connectionManager.current.sendMessage(CONNECTION_ID, {
            event: "webrtc-offer",
            data: { offer: offer.toJSON() }
          })
        }

        setConnectionStatus("in-call")
        setIsInCall(true)
        setIsConnected(true)
        setStatus("In Call")
        
        // Start call timer
        startCallTimer()
        
        // Keep screen awake during call
        KeepAwake.activate()

      } catch (error) {
        console.error("Error initializing call:", error)
        setError("Failed to initialize video call")
      }
    }

    const ensureVideoStream = async () => {
      // Check if we can reuse background stream
      if (backgroundStreamRef.current && 
          backgroundStreamRef.current.getVideoTracks().length > 0 &&
          backgroundStreamRef.current.getVideoTracks()[0].readyState === "live") {
        
        console.log("♻️ Upgrading background stream for call...")
        
        // Add audio to existing video stream
        try {
          const audioStream = await mediaDevices.getUserMedia({
            audio: true,
            video: false,
          })

          const audioTrack = audioStream.getAudioTracks()[0]
          if (audioTrack) {
            audioTrack.enabled = isMicOn
            backgroundStreamRef.current.addTrack(audioTrack)
            localStreamRef.current = backgroundStreamRef.current
            backgroundStreamRef.current = null // Transfer ownership
            console.log("✅ Successfully upgraded background stream")
            return
          }
        } catch (error) {
          console.error("Failed to add audio to background stream:", error)
        }
      }

      // Create new stream
      console.log("🆕 Creating new video stream for call...")
      const hasPermissions = await requestCameraAndMicrophonePermissions()
      if (!hasPermissions) {
        throw new Error("Camera and microphone permissions required")
      }

      const stream = await mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: cameraFacing,
        },
        audio: true,
      })

      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isMicOn
      }

      localStreamRef.current = stream
    }

    const handleWebRTCOffer = async (data: any) => {
      try {
        if (!peerConnectionRef.current) return

        const offer = new RTCSessionDescription(data.offer)
        await peerConnectionRef.current.setRemoteDescription(offer)

        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)

        connectionManager.current.sendMessage(CONNECTION_ID, {
          event: "webrtc-answer",
          data: { answer: answer.toJSON() }
        })
      } catch (error) {
        console.error("Error handling WebRTC offer:", error)
      }
    }

    const handleWebRTCAnswer = async (data: any) => {
      try {
        if (!peerConnectionRef.current) return

        const answer = new RTCSessionDescription(data.answer)
        await peerConnectionRef.current.setRemoteDescription(answer)
      } catch (error) {
        console.error("Error handling WebRTC answer:", error)
      }
    }

    const handleWebRTCIceCandidate = async (data: any) => {
      try {
        if (!peerConnectionRef.current) return

        const candidate = new RTCIceCandidate(data.candidate)
        await peerConnectionRef.current.addIceCandidate(candidate)
      } catch (error) {
        console.error("Error handling ICE candidate:", error)
      }
    }

    const handleDataChannelMessage = (data: any) => {
      switch (data.type) {
        case "camera-status":
          setIsRemoteCameraOn(data.enabled)
          break
        case "mic-status":
          setIsRemoteMicOn(data.enabled)
          break
      }
    }

    const startCallTimer = () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }

      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }

    const handlePartnerLeft = () => {
      setStatusMessage("Partner left the call")
      setStatus("Ready")
      setIsInCall(false)
      setIsConnected(false)
      setIsLocalVideoLarge(false)
      setConnectionStatus("connected")

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      remoteStreamRef.current = null

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      setIsCameraOn(true)
      setIsMicOn(true)
      setIsProcessing(false)
      setIsSearching(false)

      setRoomId(null)
      setPartnerId(null)
      setRole(null)

      // Auto-search flag is handled by useEffect
      shouldAutoSearchNextRef.current = shouldAutoSearchNextRef.current
    }

    const handleCallEnded = () => {
      setStatusMessage("Call ended")
      setStatus("Ready")
      setIsInCall(false)
      setIsConnected(false)
      setIsLocalVideoLarge(false)
      setConnectionStatus("connected")

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      remoteStreamRef.current = null

      setIsCameraOn(true)
      setIsMicOn(true)
      setIsProcessing(false)
      setIsSearching(false)

      setRoomId(null)
      setPartnerId(null)
      setRole(null)

      // Auto-search flag is handled by useEffect
      shouldAutoSearchNextRef.current = shouldAutoSearchNextRef.current
    }

    const handleConnectToServer = async () => {
      if (isButtonDisabled) return

      setIsButtonDisabled(true)
      setTimeout(() => setIsButtonDisabled(false), 1500)

      await executeAtomicOperation('connect', handleAutoConnect)
    }

    const handleFindMatch = async () => {
      if (isButtonDisabled) return

      setIsButtonDisabled(true)
      setTimeout(() => setIsButtonDisabled(false), 1500)

      await executeAtomicOperation('find_match', handleFindMatchInternal)
    }

    const handleFindMatchInternal = async (): Promise<void> => {
      if (!connectionManager.current.isConnected(CONNECTION_ID) || connectionStatus !== "connected" || isProcessing) {
        if (connectionStatus !== "connected") {
          setError("Please connect to the server first")
        } else if (isProcessing) {
          setError("Please wait, processing your request...")
        }
        return
      }

      setIsProcessing(true)
      setError("")

      try {
        // Ensure we have a video stream ready
        await ensureVideoStream()

        // Send find match request
        const success = connectionManager.current.sendMessage(CONNECTION_ID, { event: "find-match" })
        if (!success) {
          throw new Error("Failed to send find match request")
        }

        setConnectionStatus("searching")
        setStatusMessage("Searching for a match...")
        setStatus("Searching...")
        setIsSearching(true)
        setIsProcessing(false)

      } catch (error) {
        console.error("Error finding match:", error)
        setError("Failed to start search. Please try again.")
        setIsProcessing(false)
      }
    }

    const handleCancelSearch = async () => {
      if (!connectionManager.current.isConnected(CONNECTION_ID)) return

      const success = connectionManager.current.sendMessage(CONNECTION_ID, { event: "cancel-search" })
      if (success) {
        setConnectionStatus("connected")
        setStatusMessage("Search canceled")
        setStatus("Ready")
        setIsSearching(false)
        setError("")
      }
    }

    const handleBack = async () => {
      if (isButtonDisabled) return

      setIsButtonDisabled(true)
      setTimeout(() => setIsButtonDisabled(false), 1000)

      if (isInCall) {
        await executeAtomicOperation('leave_call', handleLeaveCall)
      } else {
        await executeAtomicOperation('disconnect', handleDisconnect)
      }
    }

    const handleSkip = async () => {
      console.log("🔄 Skip button pressed")
      
      await executeAtomicOperation('skip', async () => {
        // Set flag to auto-search after call ends
        shouldAutoSearchNextRef.current = true

        // Leave current call
        if (isInCall) {
          await handleLeaveCall()
        } else {
          // If not in call, start searching immediately
          if (connectionStatus === "connected" && 
              connectionManager.current.isConnected(CONNECTION_ID) && 
              !isProcessing && 
              !isSearching) {
            try {
              console.log("Skip: Not in call, starting search for next match...")
              await handleFindMatchInternal()
              shouldAutoSearchNextRef.current = false
            } catch (error) {
              console.error("Error finding next match:", error)
              setError("Failed to find next match. Please try again.")
              shouldAutoSearchNextRef.current = false
            }
          } else {
            shouldAutoSearchNextRef.current = false
          }
        }
      })
    }

    const handleLeaveCall = async (): Promise<void> => {
      const success = connectionManager.current.sendMessage(CONNECTION_ID, { event: "leave-call" })
      if (success) {
        handleCallEnded()
      }
    }

    const toggleCamera = async () => {
      console.log("Toggle camera called, current state:", isCameraOn, "has stream:", !!localStreamRef.current, "has peer:", !!peerConnectionRef.current)

      if (localStreamRef.current && peerConnectionRef.current) {
        if (isCameraOn) {
          console.log("Turning camera OFF in call")
          const videoTrack = localStreamRef.current.getVideoTracks()[0]
          if (videoTrack) {
            videoTrack.stop()
            localStreamRef.current.removeTrack(videoTrack)
          }

          // Create black video track
          try {
            const blackStream = await mediaDevices.getUserMedia({
              video: {
                width: { exact: 1 },
                height: { exact: 1 },
                facingMode: cameraFacing,
              },
            })
            const blackTrack = blackStream.getVideoTracks()[0]
            if (blackTrack) {
              blackTrack.stop() // Stop immediately to make it black
              localStreamRef.current.addTrack(blackTrack)
            }
          } catch (error) {
            console.error("Failed to create black video track:", error)
          }

          setIsCameraOn(false)

          // Notify partner
          if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
            dataChannelRef.current.send(JSON.stringify({ type: "camera-status", enabled: false }))
          }
        } else {
          console.log("Turning camera ON in call")
          // Remove existing video track
          const existingVideoTrack = localStreamRef.current.getVideoTracks()[0]
          if (existingVideoTrack) {
            localStreamRef.current.removeTrack(existingVideoTrack)
            existingVideoTrack.stop()
          }

          // Add new video track
          try {
            const videoStream = await mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: cameraFacing,
              },
            })
            const videoTrack = videoStream.getVideoTracks()[0]
            if (videoTrack && localStreamRef.current) {
              localStreamRef.current.addTrack(videoTrack)
            }
          } catch (error) {
            console.error("Failed to turn camera back on:", error)
            setError("Failed to turn camera on")
            return
          }

          setIsCameraOn(true)

          // Notify partner
          if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
            dataChannelRef.current.send(JSON.stringify({ type: "camera-status", enabled: true }))
          }
        }

        setVideoKey(prev => prev + 1)
      }
    }

    const toggleMic = async () => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = !isMicOn
          setIsMicOn(!isMicOn)

          // Notify partner
          if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
            dataChannelRef.current.send(JSON.stringify({ type: "mic-status", enabled: !isMicOn }))
          }
        }
      }
    }

    const flipCamera = async () => {
      if (!localStreamRef.current) return

      try {
        const newFacing = cameraFacing === "user" ? "environment" : "user"
        
        // Stop current video track
        const videoTrack = localStreamRef.current.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.stop()
          localStreamRef.current.removeTrack(videoTrack)
        }

        // Get new video track with flipped camera
        const newStream = await mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: newFacing,
          },
        })

        const newVideoTrack = newStream.getVideoTracks()[0]
        if (newVideoTrack && localStreamRef.current) {
          localStreamRef.current.addTrack(newVideoTrack)
          setCameraFacing(newFacing)
          setVideoKey(prev => prev + 1)
        }
      } catch (error) {
        console.error("Failed to flip camera:", error)
        setError("Failed to flip camera")
      }
    }

    // Pan responder for draggable local video
    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        localVideoPosition.setOffset({
          x: (localVideoPosition.x as any)._value,
          y: (localVideoPosition.y as any)._value,
        })
      },
      onPanResponderMove: Animated.event(
        [null, { dx: localVideoPosition.x, dy: localVideoPosition.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        localVideoPosition.flattenOffset()

        // Snap to edges
        const currentX = (localVideoPosition.x as any)._value
        const currentY = (localVideoPosition.y as any)._value
        const videoWidth = 110
        const videoHeight = 140

        let snapX = currentX
        let snapY = currentY

        // Snap to left or right edge
        if (currentX < width / 2) {
          snapX = 10
        } else {
          snapX = width - videoWidth - 10
        }

        // Keep within vertical bounds
        snapY = Math.max(10, Math.min(height - videoHeight - 100, currentY))

        Animated.spring(localVideoPosition, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: false,
        }).start()
      },
    })

    // UI Rendering Functions
    const renderVideoCall = () => (
      <View style={styles.videoCallContainer}>
        {/* Remote Video */}
        <TouchableWithoutFeedback
          onPress={() => setIsLocalVideoLarge(!isLocalVideoLarge)}
        >
          <View style={styles.remoteVideoContainer}>
            {remoteStreamRef.current ? (
              <RTCView
                key={`remote-${videoKey}`}
                style={styles.remoteVideo}
                streamURL={remoteStreamRef.current.toURL()}
                objectFit="cover"
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="person" size={80} color="#666" />
                <Text style={styles.placeholderText}>Connecting...</Text>
              </View>
            )}
            
            {/* Remote user status indicators */}
            <View style={styles.remoteStatusIndicators}>
              {!isRemoteCameraOn && (
                <View style={styles.statusIndicator}>
                  <Ionicons name="videocam-off" size={16} color="#FF6B6B" />
                </View>
              )}
              {!isRemoteMicOn && (
                <View style={styles.statusIndicator}>
                  <Ionicons name="mic-off" size={16} color="#FF6B6B" />
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Local Video - Draggable */}
        <Animated.View
          style={[
            styles.localVideoContainer,
            {
              transform: localVideoPosition.getTranslateTransform(),
              width: isLocalVideoLarge ? width - 20 : 110,
              height: isLocalVideoLarge ? (width - 20) * (4/3) : 140,
              zIndex: isLocalVideoLarge ? 1000 : 10,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {localStreamRef.current && isCameraOn ? (
            <RTCView
              key={`local-${videoKey}`}
              style={styles.localVideo}
              streamURL={localStreamRef.current.toURL()}
              objectFit="cover"
              mirror={cameraFacing === "user"}
            />
          ) : (
            <View style={styles.localVideoPlaceholder}>
              <Ionicons name="videocam-off" size={24} color="#666" />
            </View>
          )}
        </Animated.View>

        {/* Call duration */}
        <View style={styles.callDuration}>
          <Text style={styles.callDurationText}>{formatTime(callDuration)}</Text>
        </View>

        {/* Control buttons */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.roundButton, !isCameraOn && styles.disabledButton]}
              onPress={toggleCamera}
              activeOpacity={0.8}
            >
              <Ionicons name={isCameraOn ? "videocam" : "videocam-off"} size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.roundButton, !isMicOn && styles.disabledButton]}
              onPress={toggleMic}
              activeOpacity={0.8}
            >
              <Ionicons name={isMicOn ? "mic" : "mic-off"} size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cameraControlButton, styles.cameraControlActive]} onPress={flipCamera}>
              <Ionicons name="camera-reverse" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Skip Button - Main action for random chat */}
            <TouchableOpacity
              style={[styles.controlButton, styles.skipButton]}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Ionicons name="play-skip-forward" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )

    const renderMainInterface = () => (
      <View style={styles.mainContainer}>
        {/* Background camera preview */}
        <View style={styles.backgroundPreview}>
          {backgroundStreamRef.current ? (
            <RTCView
              style={styles.backgroundVideo}
              streamURL={backgroundStreamRef.current.toURL()}
              objectFit="cover"
              mirror={cameraFacing === "user"}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={60} color="#666" />
            </View>
          )}
        </View>

        {/* Status and controls overlay */}
        <View style={styles.overlay}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{statusMessage || status}</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.mainControls}>
            {connectionStatus === "disconnected" ? (
              <TouchableOpacity
                style={[styles.connectButton, { opacity: isButtonDisabled ? 0.5 : 1 }]}
                onPress={handleConnectToServer}
                disabled={isButtonDisabled}
                activeOpacity={0.8}
              >
                {isButtonDisabled ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.connectButtonText}>Connect</Text>
                )}
              </TouchableOpacity>
            ) : connectionStatus === "connected" ? (
              <TouchableOpacity
                style={[styles.findMatchButton, { opacity: isButtonDisabled ? 0.5 : 1 }]}
                onPress={handleFindMatch}
                disabled={isButtonDisabled}
                activeOpacity={0.8}
              >
                {isButtonDisabled ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="search" size={24} color="#FFFFFF" />
                    <Text style={styles.findMatchButtonText}>Find Match</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : connectionStatus === "connecting" ? (
              <View style={styles.connectingIndicator}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.connectingText}>Connecting...</Text>
              </View>
            ) : connectionStatus === "disconnected" && shouldAutoConnect ? (
              <View style={styles.connectingIndicator}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.connectingText}>Auto-connecting...</Text>
              </View>
            ) : connectionStatus === "connected" ? (
              <Text style={styles.readyText}>Ready to find a match!</Text>
            ) : connectionStatus === "searching" ? (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.searchingText}>Searching for someone...</Text>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSearch}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    )

    return (
      <View style={styles.container}>
        <Header isConnected={isConnected} onlineUsers={onlineUsers} status={status} onMenuPress={onMenuPress} />

        {isInCall ? renderVideoCall() : renderMainInterface()}
      </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  videoCallContainer: {
    flex: 1,
    position: "relative",
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: "#1A1A1F",
  },
  remoteVideo: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
  },
  placeholderText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
  },
  remoteStatusIndicators: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    gap: 8,
  },
  statusIndicator: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    padding: 6,
  },
  localVideoContainer: {
    position: "absolute",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1A1A1F",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  localVideo: {
    flex: 1,
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1F",
  },
  callDuration: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  callDurationText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  roundButton: {
    backgroundColor: "rgba(139, 92, 246, 0.3)",
  },
  endCallButton: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
    transform: [{ rotate: "135deg" }],
  },
  skipButton: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  disabledButton: {
    backgroundColor: "rgba(255, 107, 107, 0.3)",
    borderColor: "rgba(255, 107, 107, 0.5)",
  },
  cameraControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  cameraControlActive: {
    backgroundColor: "rgba(139, 92, 246, 0.3)",
  },
  mainContainer: {
    flex: 1,
  },
  backgroundPreview: {
    flex: 1,
  },
  backgroundVideo: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
    maxWidth: width - 40,
  },
  mainControls: {
    alignItems: "center",
  },
  connectButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 25,
    paddingHorizontal: 40,
    paddingVertical: 15,
    minWidth: 150,
    alignItems: "center",
  },
  connectButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  findMatchButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 180,
    justifyContent: "center",
  },
  findMatchButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  connectingIndicator: {
    alignItems: "center",
    gap: 15,
  },
  connectingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  readyText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  searchingContainer: {
    alignItems: "center",
    gap: 15,
  },
  searchingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.5)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
})

export default VideoChatScreen