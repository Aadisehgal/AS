package com.manu.ai

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.graphics.Rect
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject
import org.json.JSONArray

class ManuAccessibilityService : AccessibilityService() {
    companion object {
        var instance: ManuAccessibilityService? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event?.let {
            val data = JSONObject().apply {
                put("eventType", it.eventType)
                put("packageName", it.packageName?.toString() ?: "")
                put("className", it.className?.toString() ?: "")
                put("text", it.text?.joinToString(" ") ?: "")
                put("contentDescription", it.contentDescription?.toString() ?: "")
            }
            sendEvent("onAccessibilityEvent", data.toString())
        }
    }

    override fun onInterrupt() {}

    fun performTap(x: Float, y: Float): Boolean {
        val path = Path().apply { moveTo(x, y) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 100))
            .build()
        return dispatchGesture(gesture, null, null)
    }

    fun performSwipe(startX: Float, startY: Float, endX: Float, endY: Float): Boolean {
        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 300))
            .build()
        return dispatchGesture(gesture, null, null)
    }

    fun findAndClick(text: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val nodes = rootNode.findAccessibilityNodeInfosByText(text)
        for (node in nodes) {
            if (node.isClickable) {
                node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                return true
            }
            val parent = node.parent
            if (parent?.isClickable == true) {
                parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                return true
            }
        }
        return false
    }

    fun getCurrentScreenInfo(): String {
        val rootNode = rootInActiveWindow ?: return "{}"
        val data = JSONObject().apply {
            put("packageName", rootNode.packageName?.toString() ?: "")
            put("className", rootNode.className?.toString() ?: "")
            put("childCount", rootNode.childCount)
            put("bounds", Rect().apply { rootNode.getBoundsInScreen(this) }.toString())
        }
        return data.toString()
    }

    private fun sendEvent(eventName: String, params: String) {
        val reactContext = (application as? MainApplication)?.reactNativeHost?.reactInstanceManager?.currentReactContext
        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit(eventName, params)
    }
}

class AccessibilityModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "AccessibilityManager"

    @ReactMethod
    fun performTap(x: Double, y: Double, promise: Promise) {
        promise.resolve(ManuAccessibilityService.instance?.performTap(x.toFloat(), y.toFloat()) ?: false)
    }

    @ReactMethod
    fun performSwipe(startX: Double, startY: Double, endX: Double, endY: Double, promise: Promise) {
        promise.resolve(ManuAccessibilityService.instance?.performSwipe(
            startX.toFloat(), startY.toFloat(), endX.toFloat(), endY.toFloat()
        ) ?: false)
    }

    @ReactMethod
    fun findAndClick(text: String, promise: Promise) {
        promise.resolve(ManuAccessibilityService.instance?.findAndClick(text) ?: false)
    }

    @ReactMethod
    fun getCurrentScreenInfo(promise: Promise) {
        promise.resolve(ManuAccessibilityService.instance?.getCurrentScreenInfo() ?: "{}")
    }

    @ReactMethod
    fun requestAccessibilityAccess(promise: Promise) {
        try {
            val intent = Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
