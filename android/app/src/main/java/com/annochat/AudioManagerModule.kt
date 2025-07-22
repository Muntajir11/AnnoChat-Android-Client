package com.annochat

import android.content.Context
import android.media.AudioManager
import android.media.AudioDeviceInfo
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class AudioManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val audioManager: AudioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var originalAudioMode: Int = AudioManager.MODE_NORMAL
    private var originalSpeakerphoneOn: Boolean = false

    override fun getName(): String {
        return "AudioManagerModule"
    }

    @ReactMethod
    fun setupAudioForVideoCall(promise: Promise) {
        try {
            // Store original audio settings
            originalAudioMode = audioManager.mode
            originalSpeakerphoneOn = audioManager.isSpeakerphoneOn

            // Set audio mode for video communication
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            
            // Check if wired headset is connected
            val isWiredHeadsetConnected = audioManager.isWiredHeadsetOn
            
            // Check if Bluetooth headset is connected
            val isBluetoothConnected = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS).any { device ->
                    device.type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                    device.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
                }
            } else {
                audioManager.isBluetoothA2dpOn || audioManager.isBluetoothScoOn
            }

            // Automatically route audio based on connected devices
            when {
                isWiredHeadsetConnected -> {
                    // Use wired headset - disable speakerphone
                    audioManager.isSpeakerphoneOn = false
                    sendEvent("AudioDeviceChanged", "WIRED_HEADSET")
                }
                isBluetoothConnected -> {
                    // Use Bluetooth headset
                    audioManager.isSpeakerphoneOn = false
                    audioManager.isBluetoothScoOn = true
                    audioManager.startBluetoothSco()
                    sendEvent("AudioDeviceChanged", "BLUETOOTH")
                }
                else -> {
                    // Use speaker phone as default for video calls
                    audioManager.isSpeakerphoneOn = true
                    sendEvent("AudioDeviceChanged", "SPEAKER")
                }
            }

            val result = Arguments.createMap().apply {
                putBoolean("success", true)
                putBoolean("isWiredHeadsetConnected", isWiredHeadsetConnected)
                putBoolean("isBluetoothConnected", isBluetoothConnected)
                putBoolean("isSpeakerphoneOn", audioManager.isSpeakerphoneOn)
                putString("audioMode", getAudioModeString(audioManager.mode))
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("AUDIO_SETUP_ERROR", "Failed to setup audio: ${e.message}")
        }
    }

    @ReactMethod
    fun switchToSpeaker(promise: Promise) {
        try {
            audioManager.isSpeakerphoneOn = true
            audioManager.isBluetoothScoOn = false
            audioManager.stopBluetoothSco()
            sendEvent("AudioDeviceChanged", "SPEAKER")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("AUDIO_SWITCH_ERROR", "Failed to switch to speaker: ${e.message}")
        }
    }

    @ReactMethod
    fun switchToEarpiece(promise: Promise) {
        try {
            audioManager.isSpeakerphoneOn = false
            audioManager.isBluetoothScoOn = false
            audioManager.stopBluetoothSco()
            sendEvent("AudioDeviceChanged", "EARPIECE")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("AUDIO_SWITCH_ERROR", "Failed to switch to earpiece: ${e.message}")
        }
    }

    @ReactMethod
    fun switchToBluetooth(promise: Promise) {
        try {
            audioManager.isSpeakerphoneOn = false
            audioManager.isBluetoothScoOn = true
            audioManager.startBluetoothSco()
            sendEvent("AudioDeviceChanged", "BLUETOOTH")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("AUDIO_SWITCH_ERROR", "Failed to switch to Bluetooth: ${e.message}")
        }
    }

    @ReactMethod
    fun getAvailableAudioDevices(promise: Promise) {
        try {
            val devices = Arguments.createArray()
            
            // Always available
            devices.pushString("EARPIECE")
            devices.pushString("SPEAKER")
            
            // Check for wired headset
            if (audioManager.isWiredHeadsetOn) {
                devices.pushString("WIRED_HEADSET")
            }
            
            // Check for Bluetooth devices
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val bluetoothDevices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
                    .filter { device ->
                        device.type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                        device.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
                    }
                if (bluetoothDevices.isNotEmpty()) {
                    devices.pushString("BLUETOOTH")
                }
            } else {
                if (audioManager.isBluetoothA2dpOn || audioManager.isBluetoothScoOn) {
                    devices.pushString("BLUETOOTH")
                }
            }
            
            promise.resolve(devices)
        } catch (e: Exception) {
            promise.reject("AUDIO_DEVICES_ERROR", "Failed to get audio devices: ${e.message}")
        }
    }

    @ReactMethod
    fun getCurrentAudioDevice(promise: Promise) {
        try {
            val currentDevice = when {
                audioManager.isWiredHeadsetOn -> "WIRED_HEADSET"
                audioManager.isBluetoothScoOn -> "BLUETOOTH"
                audioManager.isSpeakerphoneOn -> "SPEAKER"
                else -> "EARPIECE"
            }
            promise.resolve(currentDevice)
        } catch (e: Exception) {
            promise.reject("AUDIO_DEVICE_ERROR", "Failed to get current audio device: ${e.message}")
        }
    }

    @ReactMethod
    fun restoreAudioSettings(promise: Promise) {
        try {
            // Restore original audio settings
            audioManager.mode = originalAudioMode
            audioManager.isSpeakerphoneOn = originalSpeakerphoneOn
            audioManager.isBluetoothScoOn = false
            audioManager.stopBluetoothSco()
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("AUDIO_RESTORE_ERROR", "Failed to restore audio settings: ${e.message}")
        }
    }

    private fun getAudioModeString(mode: Int): String {
        return when (mode) {
            AudioManager.MODE_NORMAL -> "NORMAL"
            AudioManager.MODE_RINGTONE -> "RINGTONE"
            AudioManager.MODE_IN_CALL -> "IN_CALL"
            AudioManager.MODE_IN_COMMUNICATION -> "IN_COMMUNICATION"
            else -> "UNKNOWN"
        }
    }

    private fun sendEvent(eventName: String, data: Any) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
}
