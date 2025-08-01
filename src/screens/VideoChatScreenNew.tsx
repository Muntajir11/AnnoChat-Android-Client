"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"

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
import { getVideoToken, getVideoTokenWithRetry, hasCachedToken, clearTokenCache } from "../utils/videoToken"
import { useAudioManager } from "../utils/useAudioManager"
import KeepAwake from "react-native-keep-awake"
import type RTCDataChannel from "react-native-webrtc/lib/typescript/RTCDataChannel"
import { BackHandler } from "react-native"

const { width, height } = Dimensions.get("window")

const WEBSOCKET_URL = config.videoUrl

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "searching" | "matched" | "in-call"

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

    // Add missing refs/state for reconnection logic
    const [isReconnecting, setIsReconnecting] = useState(false)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const connectionRetryCount = useRef(0)
    const MAX_RETRY_COUNT = 3

    // Animation refs
    const pulseAnim = useRef(new Animated.Value(1)).current
    const rotateAnim = useRef(new Animated.Value(0)).current
    const scaleAnim = useRef(new Animated.Value(0)).current
    const fadeAnim = useRef(new Animated.Value(0)).current
    const glowAnim = useRef(new Animated.Value(0)).current

    // Draggable local video position - start in top right
    const localVideoPosition = useRef(new Animated.ValueXY({ x: width - 130, y: 20 })).current

    // WebRTC and signaling refs
    const wsRef = useRef<WebSocket | null>(null)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const remoteStreamRef = useRef<MediaStream | null>(null)

    // Call state refs
    const [roomId, setRoomId] = useState<string | null>(null)
    const [partnerId, setPartnerId] = useState<string | null>(null)
    const [role, setRole] = useState<"caller" | "callee" | null>(null)

    // Call timer state
    const [callDuration, setCallDuration] = useState(0)
    const callTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Ref to track if skip was pressed and we should auto-search after disconnect
    const shouldAutoSearchNextRef = useRef(false)

    const sendDataChannelMessage = (message: any) => {
      try {
        if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
          dataChannelRef.current.send(JSON.stringify(message))
        } else {
          console.warn("DataChannel not ready, message not sent:", message)
        }
      } catch (error) {
        console.error("Failed to send DataChannel message:", error)
      }
    }

    const requestRemoteState = () => {
      console.log("Requesting remote peer's current camera/mic state")
      sendDataChannelMessage({ type: "request-state" })
    }

    useEffect(() => {
      if (isInCall) {
        const onBackPress = () => {
          // Optionally show a confirmation dialog
          Alert.alert("End Call?", "Are you sure you want to leave the video call?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: () => {
                disconnect()
              },
            },
          ])
          return true // Prevent default back navigation
        }

        BackHandler.addEventListener("hardwareBackPress", onBackPress)

        return () => {
          BackHandler.removeEventListener("hardwareBackPress", onBackPress)
        }
      }
    }, [isInCall])

    // Start animations on mount
    useEffect(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start()

      // Continuous pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      )
      pulseAnimation.start()

      // Glow animation
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      )
      glowAnimation.start()

      return () => {
        pulseAnimation.stop()
        glowAnimation.stop()
      }
    }, [])

    // Restart animations when returning to Ready state
    useEffect(() => {
      if (status === "Ready" && !isInCall && !isSearching) {
        // Restart pulse animation
        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 2500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 2500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        )
        pulseAnimation.start()

        // Restart glow animation
        const glowAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        )
        glowAnimation.start()

        return () => {
          pulseAnimation.stop()
          glowAnimation.stop()
        }
      }
    }, [status, isInCall, isSearching])

    // Background camera preview setup
    useEffect(() => {
      console.log("Background camera useEffect triggered:", {
        isCameraOn,
        isInCall,
        isSearching,
        hasStream: !!localStreamRef.current,
        cameraFacing,
      })

      const setupBackgroundCamera = async () => {
        try {
          // Only set up background camera if:
          // 1. Camera is supposed to be on
          // 2. Not currently in a call or searching
          // 3. No existing stream
          if (isCameraOn && !isInCall && !isSearching && !localStreamRef.current) {
            console.log("Setting up background camera preview...")
            const hasPermissions = await requestCameraAndMicrophonePermissions()
            if (!hasPermissions) return

            const stream = await mediaDevices.getUserMedia({
              video: {
                width: 640,
                height: 480,
                frameRate: 15,
                facingMode: cameraFacing,
              },
              audio: false, // Only video for background preview
            })

            localStreamRef.current = stream
            setVideoKey((prev) => prev + 1) // Force RTCView re-render
            console.log("Background camera preview created")
          }
          // Clean up stream if camera is turned off and not in call/searching
          else if (!isCameraOn && !isInCall && !isSearching && localStreamRef.current) {
            console.log("Cleaning up background camera preview...")
            localStreamRef.current.getTracks().forEach((track) => track.stop())
            localStreamRef.current = null
            setVideoKey((prev) => prev + 1) // Force RTCView to disappear
          }
        } catch (error) {
          console.error("Error setting up background camera:", error)
        }
      }

      setupBackgroundCamera()
    }, [isCameraOn, isInCall, isSearching, cameraFacing])

    // Additional effect to ensure camera preview is restored after tab switches
    useEffect(() => {
      // Small delay to ensure tab switching is complete
      const timer = setTimeout(() => {
        if (isCameraOn && !isInCall && !isSearching && !localStreamRef.current) {
          console.log("Restoring camera preview after tab switch...")
          const restoreCamera = async () => {
            try {
              const hasPermissions = await requestCameraAndMicrophonePermissions()
              if (!hasPermissions) return

              const stream = await mediaDevices.getUserMedia({
                video: {
                  width: 640,
                  height: 480,
                  frameRate: 15,
                  facingMode: cameraFacing,
                },
                audio: false,
              })

              localStreamRef.current = stream
              setVideoKey((prev) => prev + 1) // Force RTCView re-render
              console.log("Camera preview restored after tab switch")
            } catch (error) {
              console.error("Error restoring camera preview:", error)
            }
          }
          restoreCamera()
        }
      }, 300)

      return () => clearTimeout(timer)
    }, [shouldAutoConnect]) // This will trigger when tab is switched

    // Searching animation
    useEffect(() => {
      if (isSearching) {
        const rotateAnimation = Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        )
        rotateAnimation.start()
      } else {
        rotateAnim.setValue(0)
      }
    }, [isSearching])

    // Pan responder for draggable local video
    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          localVideoPosition.setOffset({
            x: (localVideoPosition.x as any)._value,
            y: (localVideoPosition.y as any)._value,
          })
          localVideoPosition.setValue({ x: 0, y: 0 })
        },
        onPanResponderMove: Animated.event([null, { dx: localVideoPosition.x, dy: localVideoPosition.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          localVideoPosition.flattenOffset()

          const currentX = (localVideoPosition.x as any)._value
          const currentY = (localVideoPosition.y as any)._value

          const videoWidth = 100
          const videoHeight = 140

          const minX = 10
          const maxX = width - videoWidth - 10
          const minY = 80
          const maxY = height - videoHeight - 200

          const boundedX = Math.max(minX, Math.min(currentX, maxX))
          const boundedY = Math.max(minY, Math.min(currentY, maxY))

          if (currentX !== boundedX || currentY !== boundedY) {
            Animated.spring(localVideoPosition, {
              toValue: { x: boundedX, y: boundedY },
              useNativeDriver: false,
            }).start()
          }
        },
      }),
    ).current

    // Call onChatStatusChange whenever isConnected changes
    useEffect(() => {
      onChatStatusChange?.(isConnected)
    }, [isConnected, onChatStatusChange])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        cleanup()
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }
    }, [])

    // Call timer effect and keep screen awake during call
    useEffect(() => {
      if (isInCall) {
        setCallDuration(0)
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1)
        }, 1000)

        KeepAwake.activate()
      } else {
        if (callTimerRef.current) {
          clearInterval(callTimerRef.current)
          callTimerRef.current = null
        }
        setCallDuration(0)

        KeepAwake.deactivate()
      }

      return () => {
        if (callTimerRef.current) {
          clearInterval(callTimerRef.current)
          callTimerRef.current = null
        }
        KeepAwake.deactivate()
      }
    }, [isInCall])

    // Unified auto-connection and reconnection logic
    useEffect(() => {
      console.log("Connection management effect:", {
        shouldAutoConnect,
        connectionStatus,
        shouldDisconnectOnTabSwitch,
        isProcessing,
        hasWebSocket: !!wsRef.current,
      })

      if (shouldDisconnectOnTabSwitch && connectionStatus !== "disconnected") {
        console.log("Auto-disconnecting from video server due to tab switch...")
        disconnect()
        return
      }

      if (
        shouldAutoConnect &&
        connectionStatus === "disconnected" &&
        !shouldDisconnectOnTabSwitch &&
        !isProcessing &&
        !wsRef.current
      ) {
        console.log("Auto-connecting to video server...")
        const timer = setTimeout(() => {
          if (connectionStatus === "disconnected" && !wsRef.current) {
            connectToServer()
          }
        }, 500)

        return () => clearTimeout(timer)
      }
    }, [shouldAutoConnect, connectionStatus, shouldDisconnectOnTabSwitch, isProcessing])

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        disconnect: () => {
          console.log("Disconnecting via ref...")
          disconnect()
        },
        reconnect: () => {
          console.log("Reconnecting via ref...")
          if (connectionStatus === "disconnected") {
            connectToServer()
          }
        },
      }),
      [connectionStatus],
    )

    // Monitor remote stream for video track changes
    useEffect(() => {
      if (remoteStreamRef.current && isInCall && !dataChannelRef.current) {
        // Only monitor tracks if DataChannel is not available
        const checkVideoTracks = () => {
          const videoTracks = remoteStreamRef.current?.getVideoTracks() || []
          const hasActiveVideo =
            videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState !== "ended"
          setIsRemoteCameraOn(hasActiveVideo)
        }

        checkVideoTracks()
        const interval = setInterval(checkVideoTracks, 1000) // Less frequent checking
        return () => clearInterval(interval)
      }
    }, [isInCall, remoteStreamRef.current, dataChannelRef.current])
    // Format call duration to MM:SS
    const formatCallDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const cleanup = () => {
      // Clear connection lock
      connectionLockRef.current = false
      
      // Clear any pending cleanup timeout
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
        cleanupTimeoutRef.current = null
      }

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      if (localStreamRef.current) {
        try {
          const tracks = localStreamRef.current.getTracks()
          if (tracks && Array.isArray(tracks)) {
            tracks.forEach((track) => {
              if (track && typeof track.stop === 'function') {
                track.stop()
              }
            })
          }
        } catch (error) {
          console.warn("Error stopping local stream tracks:", error)
        }
        localStreamRef.current = null
      }

      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
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

    // Add connection lock to prevent race conditions
    const connectionLockRef = useRef(false)
    const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const connectToServer = async (useCache: boolean = true) => {
      try {
        // Prevent multiple simultaneous connection attempts with stronger locking
        if (connectionLockRef.current || connectionStatus === "connecting" || isReconnecting) {
          console.log("Connection already in progress or locked, skipping...")
          return
        }

        connectionLockRef.current = true
        setConnectionStatus("connecting")
        setStatusMessage("Getting authorization...")
        setError("")
        setIsReconnecting(true)

        console.log("Connecting to production video chat server...", { useCache, hasCached: hasCachedToken() })

        // Use cached token when available and valid
        let tokenData
        if (useCache && hasCachedToken()) {
          console.log("🎯 Using cached connection flow")
          try {
            tokenData = await getVideoToken() // This will use cache automatically
          } catch (cacheError) {
            console.warn("Cached token failed, getting fresh token:", cacheError)
            clearTokenCache()
            tokenData = await getVideoTokenWithRetry()
          }
        } else {
          console.log("🔄 Getting fresh token")
          tokenData = await getVideoTokenWithRetry()
        }

        const { token, signature, expiresAt } = tokenData

        setStatusMessage("Connecting to server...")

        const wsUrl = `${WEBSOCKET_URL}?token=${token}&signature=${signature}&expiresAt=${expiresAt}`
        console.log("Connecting to:", WEBSOCKET_URL)

        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log("Connected to video chat server")
          setConnectionStatus("connected")
          setStatusMessage("Connected to server")
          setIsConnected(false)
          setIsReconnecting(false)
          connectionRetryCount.current = 0
          wsRef.current = ws
        }

        ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data)
            await handleServerMessage(message)
          } catch (error) {
            console.error("Error parsing server message:", error)
          }
        }

        ws.onclose = (event) => {
          console.log("Disconnected from video chat server", event.code, event.reason)
          setConnectionStatus("disconnected")
          setStatusMessage("Disconnected from server")
          setIsConnected(false)
          setIsReconnecting(false)
          wsRef.current = null

          // Auto-reconnect on unexpected disconnection (not manual)
          if (event.code !== 1000 && shouldAutoConnect && connectionRetryCount.current < MAX_RETRY_COUNT) {
            connectionRetryCount.current++
            console.log(`Auto-reconnecting attempt ${connectionRetryCount.current}/${MAX_RETRY_COUNT}`)
            reconnectTimeoutRef.current = setTimeout(() => {
              connectToServer(true) // Use cache for reconnection
            }, 2000 * connectionRetryCount.current) // Increasing delay
          }
        }

        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          setError("Connection lost. Please check your internet and try reconnecting.")
          setConnectionStatus("disconnected")
          setIsConnected(false)
          setIsReconnecting(false)
        }
      } catch (error) {
        console.error("Error connecting to server:", error)
        setIsReconnecting(false)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        if (errorMessage.includes("Session expired")) {
          setError("Session expired. Reconnecting...")
          // Clear cache and retry once
          clearTokenCache()
          if (connectionRetryCount.current < 1) {
            connectionRetryCount.current++
            setTimeout(() => connectToServer(false), 1000)
            return
          }
        }

        if (errorMessage.includes("Rate limit exceeded")) {
          const retryMatch = errorMessage.match(/Try again in (\d+) seconds/)
          const retryTime = retryMatch ? retryMatch[1] : "60"
          setError(`Too many connection attempts. Please wait ${retryTime} seconds and try again.`)
        } else if (errorMessage.includes("Network error") || errorMessage.includes("Cannot reach annochat.social")) {
          setError("Can't connect to our servers. Please check your internet connection and try again.")
        } else if (errorMessage.includes("Request timeout")) {
          setError("Connection is taking too long. Please check your internet and try again.")
        } else if (errorMessage.includes("Video token API endpoint not found")) {
          setError("Service temporarily unavailable. Our team is working on it. Please try again later.")
        } else if (errorMessage.includes("Server error")) {
          setError("Our servers are having issues. Please try again in a few minutes.")
        } else if (errorMessage.includes("Failed to get authorization")) {
          setError("Authorization failed. Please try connecting again.")
        } else {
          setError("Unable to connect. Please check your internet and try again.")
        }
        setConnectionStatus("disconnected")
        setIsConnected(false)
      } finally {
        // Always release the connection lock
        connectionLockRef.current = false
        setIsReconnecting(false)
      }
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
            setError("Too many attempts. Please wait a moment and try again.")
          } else if (serverError.includes("Network") || serverError.includes("connection")) {
            setError("Connection issue. Please check your internet and try again.")
          } else {
            setError(serverError)
          }
          break

        default:
          break
      }
    }

    const initializeCall = async (isInitiator: boolean) => {
      try {
        const peerConnection = new RTCPeerConnection({
          iceServers: ICE_SERVERS,
          iceTransportPolicy: "all",
        })
        peerConnectionRef.current = peerConnection

        // Create DataChannel for signaling camera/mic state
        let dataChannel: RTCDataChannel | null = null
        if (isInitiator) {
          dataChannel = peerConnection.createDataChannel("signal")
          ;(dataChannel as any).onopen = () => {
            console.log("DataChannel open - sending initial camera state and requesting remote state")
            // Send our current state
            sendDataChannelMessage({ type: "camera", enabled: isCameraOn })
            sendDataChannelMessage({ type: "mic", enabled: isMicOn })

            // Request remote peer's current state to ensure sync
            setTimeout(() => {
              requestRemoteState()
            }, 100) // Small delay to ensure remote DataChannel is also ready
          }
          ;(dataChannel as any).onmessage = (event: MessageEvent) => {
            try {
              const msg = JSON.parse(event.data)
              console.log("DataChannel message received:", msg)

              if (msg.type === "camera") {
                console.log("Setting remote camera state:", msg.enabled)
                setIsRemoteCameraOn(msg.enabled)
              }
              if (msg.type === "mic") {
                console.log("Setting remote mic state:", msg.enabled)
                setIsRemoteMicOn(msg.enabled)
              }
              if (msg.type === "request-state") {
                console.log("Remote peer requested current state - sending our camera/mic status")
                // Send our current state when requested
                sendDataChannelMessage({ type: "camera", enabled: isCameraOn })
                sendDataChannelMessage({ type: "mic", enabled: isMicOn })
              }
            } catch (e) {
              console.log("Invalid DataChannel message", event.data)
            }
          }

          dataChannelRef.current = dataChannel
        } else {
          ;(peerConnection as any).ondatachannel = (event: any) => {
            dataChannel = event.channel
            ;(dataChannel as any).onopen = () => {
              console.log("DataChannel open - sending current camera state")
              if (dataChannel && dataChannel.readyState === "open") {
                // Send current state, not state from when DataChannel was created
                dataChannel.send(JSON.stringify({ type: "camera", enabled: isCameraOn }))
                dataChannel.send(JSON.stringify({ type: "mic", enabled: isMicOn }))
              }
            }
            ;(dataChannel as any).onmessage = (event: MessageEvent) => {
              try {
                const msg = JSON.parse(event.data)
                console.log("DataChannel message received:", msg)
                if (msg.type === "camera") {
                  console.log("Setting remote camera state:", msg.enabled)
                  setIsRemoteCameraOn(msg.enabled)
                }
                if (msg.type === "mic") {
                  console.log("Setting remote mic state:", msg.enabled)
                  setIsRemoteMicOn(msg.enabled)
                }
              } catch (e) {
                console.log("Invalid DataChannel message", event.data)
              }
            }
            dataChannelRef.current = dataChannel
          }
        }

        if (localStreamRef.current) {
          try {
            localStreamRef.current.getTracks().forEach((track) => {
              if (localStreamRef.current) {
                peerConnection.addTrack(track, localStreamRef.current)
              }
            })
            console.log("Using addTrack method")
          } catch (error) {
            console.log("addTrack failed, trying addStream:", error)
            ;(peerConnection as any).addStream(localStreamRef.current)
            console.log("Using addStream method")
          }
        }
        ;(peerConnection as any).ontrack = (event: any) => {
          console.log("Received remote stream via ontrack")
          if (event.streams && event.streams[0]) {
            remoteStreamRef.current = event.streams[0]

            const videoTracks = event.streams[0].getVideoTracks()
            const hasActiveVideo =
              videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState !== "ended"
            setIsRemoteCameraOn(hasActiveVideo)
            console.log("Remote camera status on track received:", hasActiveVideo, "tracks:", videoTracks.length)

            event.streams[0].addEventListener("removetrack", (e: any) => {
              console.log("Remote track removed:", e.track.kind)
              if (e.track.kind === "video") {
                console.log("Remote video track removed - setting camera off")
                setIsRemoteCameraOn(false)
              }
            })

            event.streams[0].addEventListener("addtrack", (e: any) => {
              console.log("Remote track added:", e.track.kind)
              if (e.track.kind === "video") {
                console.log("Remote video track added - setting camera on")
                setIsRemoteCameraOn(true)
              }
            })

            videoTracks.forEach((track: any) => {
              track.addEventListener("ended", () => {
                console.log("Remote video track ended - setting camera off")
                setIsRemoteCameraOn(false)
              })

              track.addEventListener("mute", () => {
                console.log("Remote video track muted - setting camera off")
                setIsRemoteCameraOn(false)
              })

              track.addEventListener("unmute", () => {
                console.log("Remote video track unmuted - setting camera on")
                setIsRemoteCameraOn(true)
              })
            })

            setIsInCall(true)
            setIsConnected(true)
            setConnectionStatus("in-call")
            setStatusMessage("Connected!")
            setStatus("Connected!")
            setError("")
          }
        }
        ;(peerConnection as any).onaddstream = (event: any) => {
          console.log("Received remote stream via onaddstream")
          if (event.stream) {
            remoteStreamRef.current = event.stream

            const videoTracks = event.stream.getVideoTracks()
            const hasActiveVideo =
              videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState !== "ended"
            setIsRemoteCameraOn(hasActiveVideo)
            console.log("Remote camera status on stream received:", hasActiveVideo, "tracks:", videoTracks.length)

            event.stream.addEventListener("removetrack", (e: any) => {
              console.log("Remote track removed:", e.track.kind)
              if (e.track.kind === "video") {
                console.log("Remote video track removed - setting camera off")
                setIsRemoteCameraOn(false)
              }
            })

            event.stream.addEventListener("addtrack", (e: any) => {
              console.log("Remote track added:", e.track.kind)
              if (e.track.kind === "video") {
                console.log("Remote video track added - setting camera on")
                setIsRemoteCameraOn(true)
              }
            })

            videoTracks.forEach((track: any) => {
              track.addEventListener("ended", () => {
                console.log("Remote video track ended - setting camera off")
                setIsRemoteCameraOn(false)
              })

              track.addEventListener("mute", () => {
                console.log("Remote video track muted - setting camera off")
                setIsRemoteCameraOn(false)
              })

              track.addEventListener("unmute", () => {
                console.log("Remote video track unmuted - setting camera on")
                setIsRemoteCameraOn(true)
              })
            })

            setIsInCall(true)
            setIsConnected(true)
            setConnectionStatus("in-call")
            setStatusMessage("Connected!")
            setStatus("Connected!")
            setError("")
          }
        }
        ;(peerConnection as any).onicecandidate = (event: any) => {
          if (event.candidate && wsRef.current) {
            console.log("Sending ICE candidate")
            wsRef.current.send(
              JSON.stringify({
                event: "webrtc-ice-candidate",
                data: { candidate: event.candidate },
              }),
            )
          }
        }

        if (isInitiator) {
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          })
          await peerConnection.setLocalDescription(offer)

          if (wsRef.current) {
            wsRef.current.send(
              JSON.stringify({
                event: "webrtc-offer",
                data: { offer },
              }),
            )
          }
        }
      } catch (error) {
        console.error("Error initializing call:", error)
        setError("Failed to start video call. Please try again.")
      }
    }

    const handleWebRTCOffer = async (data: any) => {
      try {
        if (!peerConnectionRef.current) return

        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)

        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              event: "webrtc-answer",
              data: { answer },
            }),
          )
        }
      } catch (error) {
        console.error("Error handling WebRTC offer:", error)
        setError("Connection issue. Please try reconnecting.")
      }
    }

    const handleWebRTCAnswer = async (data: any) => {
      try {
        if (!peerConnectionRef.current) return
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
      } catch (error) {
        console.error("Error handling WebRTC answer:", error)
        setError("Connection issue. Please try reconnecting.")
      }
    }

    const handleWebRTCIceCandidate = async (data: any) => {
      try {
        if (!peerConnectionRef.current) return
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      } catch (error) {
        console.error("Error handling ICE candidate:", error)
      }
    }

    // Auto-search for next match after skip when call ends
    useEffect(() => {
      if (
        shouldAutoSearchNextRef.current &&
        !isInCall &&
        connectionStatus === "connected" &&
        wsRef.current &&
        !isProcessing &&
        !isSearching
      ) {
        // Start searching for next match
        findMatch()
        shouldAutoSearchNextRef.current = false
      }
    }, [isInCall, connectionStatus, isProcessing, isSearching])

    const handlePartnerLeft = async () => {
      console.log("handlePartnerLeft: Starting cleanup...")
      
      setStatusMessage("Partner left the call")
      setStatus("Ready")
      setIsInCall(false)
      setIsConnected(false)
      setIsLocalVideoLarge(false)
      setConnectionStatus("connected")

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      // Stop and clean up local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          console.log("Stopping track:", track.kind)
          track.stop()
        })
        localStreamRef.current = null
      }

      // Clean up remote stream
      remoteStreamRef.current = null

      if (isAudioSetup) {
        try {
          console.log("Restoring audio settings after partner left...")
          await restoreAudioSettings()
          console.log("Audio settings restored successfully")
        } catch (error) {
          console.error("Failed to restore audio settings:", error)
        }
      }

      // Reset media states
      setIsCameraOn(true)
      setIsMicOn(true)
      setIsProcessing(false)
      setIsSearching(false)

      // Reset call states
      setRoomId(null)
      setPartnerId(null)
      setRole(null)
      
      // Clear data channel
      dataChannelRef.current = null

      console.log("handlePartnerLeft: Cleanup completed")
    }

    const handleCallEnded = async () => {
      console.log("handleCallEnded: Starting call cleanup...")
      
      setStatusMessage("Call ended")
      setStatus("Ready")
      setIsInCall(false)
      setIsConnected(false)
      setIsLocalVideoLarge(false)
      setConnectionStatus("connected")

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      // Stop and clean up local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          console.log("Stopping track:", track.kind)
          track.stop()
        })
        localStreamRef.current = null
      }

      // Clean up remote stream
      remoteStreamRef.current = null

      if (isAudioSetup) {
        try {
          console.log("Restoring audio settings after call ended...")
          await restoreAudioSettings()
          console.log("Audio settings restored successfully")
        } catch (error) {
          console.error("Failed to restore audio settings:", error)
        }
      }

      // Reset media states
      setIsCameraOn(true)
      setIsMicOn(true)
      setIsProcessing(false)
      setIsSearching(false)

      // Reset call states
      setRoomId(null)
      setPartnerId(null)
      setRole(null)
      
      // Clear data channel
      dataChannelRef.current = null

      console.log("handleCallEnded: Cleanup completed")
    }

    const handleConnectToServer = async () => {
      if (isButtonDisabled) return

      setIsButtonDisabled(true)
      setTimeout(() => setIsButtonDisabled(false), 1500)

      await connectToServer()
    }

    const handleFindMatch = async () => {
      if (isButtonDisabled) return

      setIsButtonDisabled(true)
      setTimeout(() => setIsButtonDisabled(false), 1500)

      findMatch()
    }

    const findMatch = async () => {
  if (!wsRef.current || connectionStatus !== "connected" || isProcessing) {
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
    // **IMPORTANT: Add small delay to ensure audio cleanup is complete**
    // This prevents audio conflicts when auto-searching after skip
    if (shouldAutoSearchNextRef.current) {
      console.log("Auto-search detected, adding delay for audio cleanup...")
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Check permissions first
    const hasPermissions = await requestCameraAndMicrophonePermissions()
    if (!hasPermissions) {
      setIsProcessing(false)
      return
    }

    // Check if we already have a video stream from background preview
    const hasExistingVideoStream =
      localStreamRef.current &&
      localStreamRef.current.getVideoTracks().length > 0 &&
      localStreamRef.current.getVideoTracks()[0].readyState !== "ended"

    if (hasExistingVideoStream) {
      console.log("Reusing existing background camera stream, just adding audio...")

      // We have a good video stream, just need to add audio
      try {
        const audioStream = await mediaDevices.getUserMedia({
          audio: true,
          video: false,
        })

        const audioTrack = audioStream.getAudioTracks()[0]
        if (audioTrack && localStreamRef.current) {
          audioTrack.enabled = isMicOn
          localStreamRef.current.addTrack(audioTrack)
          console.log("Added audio track to existing video stream")
        }
      } catch (audioError) {
        console.warn("Failed to add audio track, continuing with video only:", audioError)
      }
    } else {
      console.log("No existing video stream, creating new media stream...")

      // Clean up any existing stream
      if (localStreamRef.current) {
        console.log("Cleaning up existing stream before creating new one")
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      console.log("Creating media stream with camera facing:", cameraFacing)
      const stream = await mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          frameRate: 15,
          facingMode: cameraFacing,
        },
        audio: true,
      })

      localStreamRef.current = stream
      console.log("Media stream created successfully")
    }

    // **CRITICAL: Setup audio routing with better error handling**
    console.log("Setting up audio routing...")
    try {
      const audioSetupSuccess = await setupAudioForVideoCall()
      if (audioSetupSuccess) {
        console.log("Audio setup successful, current device:", currentDevice)
      } else {
        console.warn("Audio setup failed, continuing with default settings")
      }
    } catch (audioError) {
      console.error("Audio setup error:", audioError)
      // Continue with call setup even if audio routing fails
    }

    // Ensure tracks are enabled according to current settings
    const videoTrack = localStreamRef.current?.getVideoTracks()[0]
    const audioTrack = localStreamRef.current?.getAudioTracks()[0]

    if (videoTrack) {
      videoTrack.enabled = isCameraOn
      console.log("Video track enabled:", isCameraOn)
    }

    if (audioTrack) {
      audioTrack.enabled = isMicOn
      console.log("Audio track enabled:", isMicOn)
    }

    // Send find match request
    wsRef.current.send(JSON.stringify({ event: "find-match" }))

    setConnectionStatus("searching")
    setStatusMessage("Getting ready...")
    setStatus("Getting ready...")
    
  } catch (error) {
    console.error("Error accessing media devices:", error)
    setError("Unable to access camera/microphone. Please grant permissions and try again.")
    setIsProcessing(false)

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    Alert.alert("Permission Required", "Please grant camera and microphone permissions to use video chat.", [
      { text: "OK" },
    ])
  }
}

    const handleCancelSearch = () => {
      if (isButtonDisabled) return

      setIsButtonDisabled(true)
      setTimeout(() => setIsButtonDisabled(false), 1000)

      cancelSearch()
    }

    const cancelSearch = () => {
      if (!wsRef.current) return

      console.log("Cancelling search and cleaning up stream")
      wsRef.current.send(JSON.stringify({ event: "cancel-search" }))

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          console.log("Stopping track:", track.kind)
          track.stop()
        })
        localStreamRef.current = null
      }

      setIsSearching(false)
      setStatus("Ready")
      setIsProcessing(false)

      console.log("Search cancelled, stream cleaned up")
    }

    const handleDisconnect = () => {
      if (isButtonDisabled) return

      setIsButtonDisabled(true)
      setTimeout(() => setIsButtonDisabled(false), 1000)

      if (isInCall) {
        leaveCall()
      } else {
        disconnect()
      }
    }

    const handleSkip = async () => {
      // Show confirmation alert similar to hardware back button
      Alert.alert(
        "Skip to Next?", 
        "Are you sure you want to skip to the next person?", 
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Skip",
            style: "destructive",
            onPress: () => {
              performSkip()
            },
          },
        ]
      )
    }

    const performSkip = async () => {
      console.log("🔄 Skip button clicked - using smart reconnection")
      
      // Set flag to auto-search after call ends
      shouldAutoSearchNextRef.current = true

      // Leave current call
      if (isInCall) {
        leaveCall()
      } else {
        // If not in call, check connection status and reuse if possible
        if (connectionStatus === "connected" && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && hasCachedToken()) {
          console.log("🎯 Reusing existing connection for skip")
          try {
            await findMatch()
            shouldAutoSearchNextRef.current = false
          } catch (error) {
            console.error("Error finding next match with existing connection:", error)
            // If existing connection fails, establish new one
            console.log("🔄 Existing connection failed, establishing new connection")
            setError("Reconnecting...")
            await connectToServer(true) // Use cache
            shouldAutoSearchNextRef.current = false
          }
        } else {
          console.log("🔄 No valid connection, establishing new one for skip")
          try {
            await connectToServer(true) // Use cached tokens when available
            // findMatch will be called automatically via shouldAutoSearchNextRef
          } catch (error) {
            console.error("Error establishing connection for skip:", error)
            setError("Failed to connect. Please try again.")
            shouldAutoSearchNextRef.current = false
          }
        }
      }
    }

    const leaveCall = () => {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ event: "leave-call" }))
      }
      handleCallEnded()
    }

    const disconnect = () => {
      cleanup()
      setConnectionStatus("disconnected")
      setStatusMessage("")
      setError("")
    }

    const toggleCamera = async () => {
      console.log(
        "Toggle camera called, current state:",
        isCameraOn,
        "has stream:",
        !!localStreamRef.current,
        "has peer:",
        !!peerConnectionRef.current,
      )

      if (localStreamRef.current && peerConnectionRef.current) {
        if (isCameraOn) {
          console.log("Turning camera OFF in call")
          const videoTrack = localStreamRef.current.getVideoTracks()[0]
          if (videoTrack) {
            videoTrack.stop()
            localStreamRef.current.removeTrack(videoTrack)
          }

          const videoSender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "video")
          if (videoSender) {
            try {
              await videoSender.replaceTrack(null)
              console.log("Successfully replaced video track with null")
            } catch (error) {
              console.log("Could not replace track with null:", error)
              peerConnectionRef.current.removeTrack(videoSender)
            }
          }

          setIsCameraOn(false)
          console.log("Camera turned OFF in call")
          // Send camera state to remote peer
          if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
            dataChannelRef.current.send(JSON.stringify({ type: "camera", enabled: false }))
          }
        } else {
          console.log("Turning camera ON in call")
          try {
            const newStream = await mediaDevices.getUserMedia({
              video: {
                width: 640,
                height: 480,
                frameRate: 15,
                facingMode: cameraFacing,
              },
              audio: false,
            })

            const newVideoTrack = newStream.getVideoTracks()[0]
            if (newVideoTrack) {
              newVideoTrack.enabled = true
              localStreamRef.current.addTrack(newVideoTrack)

              const existingVideoSender = peerConnectionRef.current
                .getSenders()
                .find((s) => s.track === null || (s.track && s.track.kind === "video"))

              if (existingVideoSender) {
                await existingVideoSender.replaceTrack(newVideoTrack)
                console.log("Replaced null track with new video track")
              } else {
                peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current)
                console.log("Added new video track to peer connection")
              }

              setIsCameraOn(true)
              console.log("Camera turned ON in call")
              // Send camera state to remote peer
              if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
                dataChannelRef.current.send(JSON.stringify({ type: "camera", enabled: true }))
              }
            }
          } catch (error) {
            console.error("Error turning camera on in call:", error)
            setError("Unable to turn on camera. Please try again.")
          }
        }
      } else if (localStreamRef.current) {
        console.log("Toggling camera during search/preparation or background preview")
        const videoTrack = localStreamRef.current.getVideoTracks()[0]

        if (isCameraOn) {
          console.log("Turning off camera - cleaning up stream")
          // For background preview, completely stop and clean up the stream
          if (!isInCall && !isSearching) {
            localStreamRef.current.getTracks().forEach((track) => track.stop())
            localStreamRef.current = null
            setVideoKey((prev) => prev + 1) // Force RTCView to disappear
            console.log("Background camera stream cleaned up")
          } else {
            // During search, just disable the track
            if (videoTrack) {
              videoTrack.enabled = false
            }
          }
          setIsCameraOn(false)
          // Send camera state to remote peer
          if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
            dataChannelRef.current.send(JSON.stringify({ type: "camera", enabled: false }))
          }
        } else {
          if (videoTrack && videoTrack.readyState !== "ended") {
            console.log("Enabling existing video track during search")
            videoTrack.enabled = true
            setIsCameraOn(true)
            // Send camera state to remote peer
            if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
              dataChannelRef.current.send(JSON.stringify({ type: "camera", enabled: true }))
            }
          } else {
            console.log("Creating new video track")
            try {
              if (videoTrack) {
                videoTrack.stop()
                localStreamRef.current.removeTrack(videoTrack)
              }

              const newVideoStream = await mediaDevices.getUserMedia({
                video: {
                  width: 640,
                  height: 480,
                  frameRate: 15,
                  facingMode: cameraFacing,
                },
                audio: false,
              })

              const newVideoTrack = newVideoStream.getVideoTracks()[0]
              if (newVideoTrack) {
                newVideoTrack.enabled = true
                localStreamRef.current.addTrack(newVideoTrack)
                setIsCameraOn(true)
                console.log("Added new video track")
              }
            } catch (error) {
              console.error("Error creating video track:", error)
              setError("Unable to turn on camera. Please try again.")
            }
          }
        }
      } else {
        console.log("No stream available for camera toggle")
        console.log("Current state - isCameraOn:", isCameraOn, "isInCall:", isInCall, "isSearching:", isSearching)

        const newCameraState = !isCameraOn
        setIsCameraOn(newCameraState)
        console.log("Camera state toggled to:", newCameraState)

        // If turning camera on and not in call/searching, manually create background preview
        if (newCameraState && !isInCall && !isSearching) {
          console.log("Manually creating background camera stream...")
          try {
            const hasPermissions = await requestCameraAndMicrophonePermissions()
            if (!hasPermissions) {
              setIsCameraOn(false) // Revert state on permission failure
              return
            }

            const stream = await mediaDevices.getUserMedia({
              video: {
                width: 640,
                height: 480,
                frameRate: 15,
                facingMode: cameraFacing,
              },
              audio: false,
            })

            localStreamRef.current = stream
            setVideoKey((prev) => prev + 1) // Force RTCView re-render
            console.log("Background camera stream created manually")
          } catch (error) {
            console.error("Error creating background camera stream manually:", error)
            setError("Unable to access camera. Please try again.")
            setIsCameraOn(false) // Revert state on error
          }
        }
      }
    }

    const toggleMic = () => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0]
        if (audioTrack) {
          // Audio track exists, toggle it
          audioTrack.enabled = !audioTrack.enabled
          setIsMicOn(audioTrack.enabled)
          console.log("Audio track toggled:", audioTrack.enabled)
          // Send mic state to remote peer
          if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
            dataChannelRef.current.send(JSON.stringify({ type: "mic", enabled: audioTrack.enabled }))
          }
        } else {
          // No audio track (background camera stream), just update state
          setIsMicOn(!isMicOn)
          console.log("No audio track available, just updating state:", !isMicOn)
          // Send mic state to remote peer
          if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
            dataChannelRef.current.send(JSON.stringify({ type: "mic", enabled: !isMicOn }))
          }
        }
      } else {
        // No stream at all, just update state
        setIsMicOn(!isMicOn)
        console.log("No stream available, updating mic state:", !isMicOn)
        // Send mic state to remote peer
        if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
          dataChannelRef.current.send(JSON.stringify({ type: "mic", enabled: !isMicOn }))
        }
      }
    }

    const flipCamera = async () => {
      if (!localStreamRef.current) {
        console.log("No local stream available for camera flip")
        return
      }

      try {
        console.log("Flipping camera from", cameraFacing, "to", cameraFacing === "user" ? "environment" : "user")

        const currentAudioTrack = localStreamRef.current.getAudioTracks()[0]

        const currentVideoTrack = localStreamRef.current.getVideoTracks()[0]
        if (currentVideoTrack) {
          currentVideoTrack.stop()
          localStreamRef.current.removeTrack(currentVideoTrack)
          console.log("Stopped and removed current video track")
        }

        const newFacing = cameraFacing === "user" ? "environment" : "user"

        const newVideoStream = await mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            frameRate: 15,
            facingMode: newFacing,
          },
          audio: false,
        })

        const newVideoTrack = newVideoStream.getVideoTracks()[0]

        if (newVideoTrack) {
          newVideoTrack.enabled = isCameraOn

          localStreamRef.current.addTrack(newVideoTrack)

          console.log("Added new video track with facing:", newFacing, "enabled:", isCameraOn)

          setCameraFacing(newFacing)

          setVideoKey((prev) => prev + 1)

          if (peerConnectionRef.current && isInCall) {
            const videoSender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "video")
            if (videoSender) {
              await videoSender.replaceTrack(newVideoTrack)
              console.log("Updated video track in peer connection")
            }
          }

          console.log("Camera flip completed successfully - preview should update")
        } else {
          throw new Error("Failed to get new video track")
        }
      } catch (error) {
        console.error("Error flipping camera:", error)
        setError("Unable to switch camera. Please try again.")

        try {
          console.log("Attempting to restore video track...")
          const restoreStream = await mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480,
              frameRate: 15,
              facingMode: cameraFacing,
            },
            audio: false,
          })

          const restoreVideoTrack = restoreStream.getVideoTracks()[0]
          if (restoreVideoTrack) {
            restoreVideoTrack.enabled = isCameraOn
            localStreamRef.current?.addTrack(restoreVideoTrack)
            console.log("Restored video track successfully")
          }
        } catch (restoreError) {
          console.error("Failed to restore video track:", restoreError)
          try {
            await recreateStream()
          } catch (recreateError) {
            console.error("Failed to recreate stream:", recreateError)
          }
        }
      }
    }

    const recreateStream = async () => {
      console.log("Recreating entire stream...")

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      try {
        const newStream = await mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            frameRate: 15,
            facingMode: cameraFacing,
          },
          audio: true,
        })

        const videoTrack = newStream.getVideoTracks()[0]
        const audioTrack = newStream.getAudioTracks()[0]

        if (videoTrack) {
          videoTrack.enabled = isCameraOn
        }
        if (audioTrack) {
          audioTrack.enabled = isMicOn
        }

        localStreamRef.current = newStream
        console.log("Stream recreated successfully")

        if (peerConnectionRef.current && isInCall) {
          const senders = peerConnectionRef.current.getSenders()

          for (const sender of senders) {
            if (sender.track) {
              const newTrack = newStream.getTracks().find((track) => track.kind === sender.track?.kind)
              if (newTrack) {
                await sender.replaceTrack(newTrack)
              }
            }
          }
          console.log("Updated all tracks in peer connection")
        }
      } catch (error) {
        console.error("Failed to recreate stream:", error)
        setError("Camera issue. Please restart the app.")
      }
    }

    const getAudioDeviceIcon = (device: string | null) => {
      switch (device) {
        case "BLUETOOTH":
          return "bluetooth"
        case "WIRED_HEADSET":
          return "headset"
        case "SPEAKER":
          return "volume-high"
        case "EARPIECE":
          return "call"
        default:
          return "volume-high"
      }
    }

    const getAudioDeviceLabel = (device: string) => {
      switch (device) {
        case "BLUETOOTH":
          return "Bluetooth"
        case "WIRED_HEADSET":
          return "Headset"
        case "SPEAKER":
          return "Speaker"
        case "EARPIECE":
          return "Phone"
        default:
          return device
      }
    }

    const showAudioDeviceOptions = () => {
      if (availableDevices.length <= 1) return

      const options = availableDevices.map((device) => ({
        text: getAudioDeviceLabel(device),
        onPress: () => switchAudioDevice(device),
      }))

      options.push({
        text: "Cancel",
        onPress: async () => {},
      })

      Alert.alert("Audio Output", "Choose your audio output device", options, {
        cancelable: true,
      })
    }

    const switchAudioDevice = async (device: string) => {
      try {
        let success = false
        switch (device) {
          case "SPEAKER":
            success = await switchToSpeaker()
            break
          case "EARPIECE":
            success = await switchToEarpiece()
            break
          case "BLUETOOTH":
            success = await switchToBluetooth()
            break
          default:
            console.warn("Unknown audio device:", device)
        }

        if (success) {
          console.log("Successfully switched to audio device:", device)
        } else {
          console.error("Failed to switch to audio device:", device)
        }
      } catch (error) {
        console.error("Error switching audio device:", error)
      }
    }

    const handleDoubleTap = () => {
      if (isInCall) {
        setIsLocalVideoLarge(!isLocalVideoLarge)
      }
    }

    const lastTap = useRef<number>(0)
    const handleLocalVideoTouch = () => {
      const now = Date.now()
      const DOUBLE_PRESS_DELAY = 300
      if (lastTap.current && now - lastTap.current < DOUBLE_PRESS_DELAY) {
        handleDoubleTap()
      } else {
        lastTap.current = now
      }
    }

    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    })

    const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    })

    // Render the main interface when not in call
    const renderMainInterface = () => (
      <View style={styles.mainInterfaceContainer}>
        {/* Background Camera Feed */}
        {isCameraOn && localStreamRef.current && (
          <RTCView
            key={`background-camera-${videoKey}`}
            style={styles.backgroundCameraView}
            streamURL={localStreamRef.current.toURL()}
            objectFit="cover"
            mirror={cameraFacing === "user"}
          />
        )}

        {/* Dark overlay to ensure UI visibility */}
        <View style={styles.backgroundOverlay} />

        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          {/* Status Chip - Top Right */}
          {/* <View style={styles.statusContainer}>
            <View style={styles.statusChip}>
              <View style={[styles.statusDot, { backgroundColor: status === "Ready" ? "#FF6B6B" : "#FFD93D" }]} />
              <Text style={styles.statusChipText}>{onlineUsers} online</Text>
            </View>
          </View> */}

          {/* Main Video Interface */}
          <View style={styles.videoInterface}>
            <Animated.View
              style={[
                styles.centralVideoOrb,
                {
                  transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }, { rotate: spin }],
                },
              ]}
            >
              <View style={styles.videoOrbInner}>
                {isSearching ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <Ionicons name="videocam" size={70} color="#FFFFFF" />
                )}
              </View>

              {/* Orbital rings with glow effect */}
              <Animated.View style={[styles.orbitalRing1, { opacity: glowOpacity }]} />
              <View style={styles.orbitalRing2} />
              <View style={styles.orbitalRing3} />
            </Animated.View>

            <Text style={styles.mainTitle}>{isSearching ? "Scanning Universe..." : "Video Discovery"}</Text>

            <Text style={styles.subtitle}>
              {isSearching
                ? "Connecting you with someone amazing via video"
                : "Experience face-to-face conversations with strangers worldwide"}
            </Text>
          </View>

          {/* Centered Quick Match Button */}
          <View style={styles.centerActionContainer}>
            <TouchableOpacity
              style={[
                styles.quickMatchButton,
                isSearching && styles.quickMatchButtonActive,
                (isButtonDisabled || (status !== "Ready" && !isSearching)) && styles.quickMatchButtonDisabled,
              ]}
              onPress={
                connectionStatus === "disconnected"
                  ? handleConnectToServer
                  : connectionStatus === "connected"
                    ? handleFindMatch
                    : isSearching
                      ? handleCancelSearch
                      : isConnected
                        ? handleDisconnect
                        : handleConnectToServer
              }
              disabled={isButtonDisabled || isProcessing}
            >
              <Ionicons
                name={
                  connectionStatus === "disconnected"
                    ? "link"
                    : connectionStatus === "connected"
                      ? "videocam"
                      : isSearching
                        ? "stop-circle"
                        : isConnected
                          ? "stop"
                          : "link"
                }
                size={24}
                color="#FFFFFF"
              />
              <Text
                style={[
                  styles.quickMatchButtonText,
                  (isButtonDisabled || isProcessing) && styles.quickMatchButtonDisabledText,
                ]}
              >
                {connectionStatus === "connecting"
                  ? "Connecting..."
                  : connectionStatus === "disconnected" && !shouldAutoConnect
                    ? "Connect"
                    : connectionStatus === "disconnected" && shouldAutoConnect
                      ? "Connecting..."
                      : connectionStatus === "connected"
                        ? "Start Video"
                        : isSearching
                          ? "Stop Search"
                          : isConnected
                            ? "Disconnect"
                            : "Start Video"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={[
                styles.cameraControlButton,
                isCameraOn ? styles.cameraControlActive : styles.cameraControlInactive,
              ]}
              onPress={toggleCamera}
            >
              <Ionicons name={isCameraOn ? "videocam" : "videocam-off"} size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cameraControlButton, isMicOn ? styles.cameraControlActive : styles.cameraControlInactive]}
              onPress={toggleMic}
            >
              <Ionicons name={isMicOn ? "mic" : "mic-off"} size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {isCameraOn && localStreamRef.current && (
              <TouchableOpacity style={[styles.cameraControlButton, styles.cameraControlActive]} onPress={flipCamera}>
                <Ionicons name="camera-reverse" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </Animated.View>
      </View>
    )

    // Render video call interface when in call
    const renderVideoCall = () => (
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
                mirror={cameraFacing === "user"}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <View style={styles.placeholderBackground} />
                <>
                  <Ionicons name="videocam" size={48} color="#8BC34A" />
                  <Text style={styles.placeholderText}>Your Video</Text>
                </>
              </View>
            )
          ) : // Show remote video or placeholder based on isRemoteCameraOn state from DataChannel
          remoteStreamRef.current && isRemoteCameraOn ? (
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
          )}
        </View>

        {/* Small Video (Local or Remote based on toggle) */}
        <Animated.View
          style={[
            styles.localVideo,
            {
              transform: localVideoPosition.getTranslateTransform(),
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback onPress={handleLocalVideoTouch}>
            <View style={styles.localVideoTouchArea}>
              {isLocalVideoLarge ? (
                // Show remote video in small area when toggled
                remoteStreamRef.current && isRemoteCameraOn ? (
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
              ) : // Show local video in small area (default)
              localStreamRef.current && isCameraOn ? (
                <>
                  <RTCView
                    key={`local-small-${videoKey}`}
                    style={styles.localVideoView}
                    streamURL={localStreamRef.current.toURL()}
                    objectFit="cover"
                    mirror={cameraFacing === "user"}
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
                        <Ionicons name="videocam" size={20} color="#8BC34A" />
                        <Text style={styles.selfText}>You</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="videocam" size={20} color="#8BC34A" />
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
              )}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Call Duration Display */}
        {isInCall && (
          <View style={styles.callDurationContainer}>
            <Text style={styles.callDurationText}>{formatCallDuration(callDuration)}</Text>
          </View>
        )}

        {/* In-Call Controls */}
        <View style={styles.inCallControlContainer}>
          <View style={styles.controlPanel}>
            {/* Camera Toggle */}
            <TouchableOpacity
              style={[styles.controlButton, styles.roundButton, !isCameraOn && styles.disabledButton]}
              onPress={toggleCamera}
              activeOpacity={0.8}
            >
              <Ionicons name={isCameraOn ? "videocam" : "videocam-off"} size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Mic Toggle */}
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

    return (
      <View style={styles.container}>
        <Header isConnected={isConnected} onlineUsers={onlineUsers} status={status} onMenuPress={onMenuPress} />

        {isInCall ? renderVideoCall() : renderMainInterface()}
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  mainInterfaceContainer: {
    flex: 1,
    position: "relative",
  },
  backgroundCameraView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 10, 15, 0.75)",
    zIndex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  statusContainer: {
    alignItems: "flex-end",
    marginTop: 20,
    marginBottom: 20,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
  },
  // statusDot: {
  //   width: 8,
  //   height: 8,
  //   borderRadius: 4,
  // },
  statusChipText: {
    color: "#8BC34A",
    fontSize: 13,
    fontWeight: "600",
  },
  videoInterface: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centralVideoOrb: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    position: "relative",
  },
  videoOrbInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
  },
  orbitalRing1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(76, 175, 80, 0.4)",
    borderStyle: "dashed",
  },
  orbitalRing2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  orbitalRing3: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "rgba(255, 211, 61, 0.15)",
  },

  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: 40,
  },
  centerActionContainer: {
    alignItems: "center",
    paddingBottom: 40,
  },
  quickMatchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 12,
    minWidth: 200,
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  quickMatchButtonActive: {
    backgroundColor: "#8B5CF6",
    shadowColor: "#8B5CF6",
  },
  quickMatchButtonDisabled: {
    backgroundColor: "#374151",
    shadowOpacity: 0.1,
    shadowColor: "#000000",
    opacity: 0.6,
  },
  quickMatchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  quickMatchButtonDisabledText: {
    color: "#9CA3AF",
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingBottom: 140,
  },
  cameraControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  cameraControlActive: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderColor: "#4CAF50",
  },
  cameraControlInactive: {
    backgroundColor: "rgba(55, 65, 81, 0.5)",
    borderColor: "#6B7280",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    color: "#8BC34A",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  // Video call styles
  videoContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#1E293B",
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: "#1E293B",
  },
  remoteVideoView: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E293B",
    position: "relative",
  },
  placeholderBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1E293B",
    opacity: 0.8,
  },
  placeholderText: {
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
    zIndex: 1,
  },
  searchingVideoText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
    zIndex: 1,
  },
  localVideo: {
    position: "absolute",
    width: 100,
    height: 140,
    backgroundColor: "#000000",
    overflow: "hidden",
    zIndex: 9999,
  },
  localVideoView: {
    flex: 1,
    backgroundColor: "#000000",
    width: "100%",
    height: "100%",
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  localVideoTouchArea: {
    flex: 1,
    position: "relative",
  },
  smallVideoIndicator: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  smallVideoIndicatorText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E293B",
    position: "relative",
  },
  noVideoText: {
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
    fontWeight: "500",
    zIndex: 1,
  },
  noVideoSmallContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E293B",
  },
  callDurationContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  callDurationText: {
    color: "#F0FDF4",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  inCallControlContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  controlPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: 40,
    gap: 30,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  roundButton: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  disabledButton: {
    backgroundColor: "rgba(76, 175, 80, 0.7)",
    borderColor: "rgba(124, 179, 66, 0.5)",
  },
  skipButton: {
    backgroundColor: "rgba(139, 92, 246, 0.9)", // Purple color for skip
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250,  0.7)",
    width: 64, // Slightly larger for emphasis
    height: 64,
    borderRadius: 32,
  },
  endCallButton: {
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.7)",
  },
  selfText: {
    color: "#8BC34A",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  selfTextOff: {
    color: "#9CA3AF",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
})
