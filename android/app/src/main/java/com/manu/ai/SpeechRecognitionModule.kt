package com.manu.ai

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechRecognitionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), RecognitionListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    private val handler = Handler(Looper.getMainLooper())
    private var continuousListening = false
    private var currentLocale = "en-US"

    override fun getName(): String = "SpeechRecognition"

    @ReactMethod
    fun startListening(locale: String?, continuous: Boolean, promise: Promise) {
        try {
            if (ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Microphone permission not granted")
                return
            }

            currentLocale = locale ?: "en-US"
            continuousListening = continuous

            if (speechRecognizer == null) {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactApplicationContext)
                speechRecognizer?.setRecognitionListener(this)
            }

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, currentLocale)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 1000)
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1500)
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1000)
            }

            isListening = true
            speechRecognizer?.startListening(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            continuousListening = false
            isListening = false
            speechRecognizer?.stopListening()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun destroy(promise: Promise) {
        try {
            continuousListening = false
            isListening = false
            speechRecognizer?.destroy()
            speechRecognizer = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(SpeechRecognizer.isRecognitionAvailable(reactApplicationContext))
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, params)
    }

    private fun restartListening() {
        if (continuousListening && !isListening) {
            handler.postDelayed({
                if (continuousListening) {
                    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE, currentLocale)
                        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                    }
                    isListening = true
                    speechRecognizer?.startListening(intent)
                }
            }, 500)
        }
    }

    override fun onReadyForSpeech(params: Bundle?) {
        val event = Arguments.createMap()
        event.putString("status", "ready")
        sendEvent("onSpeechStatus", event)
    }

    override fun onBeginningOfSpeech() {
        val event = Arguments.createMap()
        event.putString("status", "started")
        sendEvent("onSpeechStatus", event)
    }

    override fun onRmsChanged(rmsdB: Float) {
        val event = Arguments.createMap()
        event.putDouble("rms", rmsdB.toDouble())
        sendEvent("onSpeechVolume", event)
    }

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        val event = Arguments.createMap()
        event.putString("status", "ended")
        sendEvent("onSpeechStatus", event)
        isListening = false
        restartListening()
    }

    override fun onError(error: Int) {
        val event = Arguments.createMap()
        event.putString("status", "error")
        event.putInt("errorCode", error)
        sendEvent("onSpeechStatus", event)
        isListening = false
        restartListening()
    }

    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val event = Arguments.createMap()
            event.putString("text", matches[0])
            event.putArray("alternatives", Arguments.fromList(matches))
            sendEvent("onSpeechResult", event)
        }
        isListening = false
        restartListening()
    }

    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val event = Arguments.createMap()
            event.putString("text", matches[0])
            event.putString("isFinal", "false")
            sendEvent("onSpeechPartial", event)
        }
    }

    override fun onEvent(eventType: Int, params: Bundle?) {}
}
