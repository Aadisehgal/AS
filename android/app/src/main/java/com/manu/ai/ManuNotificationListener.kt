package com.manu.ai

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.content.Intent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject
import org.json.JSONArray

class ManuNotificationListener : NotificationListenerService() {
    companion object {
        var instance: ManuNotificationListener? = null
        var pendingNotifications: MutableList<JSONObject> = mutableListOf()
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn?.let {
            val notif = JSONObject().apply {
                put("packageName", it.packageName)
                put("title", it.notification.extras.getString("android.title") ?: "")
                put("text", it.notification.extras.getCharSequence("android.text")?.toString() ?: "")
                put("ticker", it.notification.tickerText?.toString() ?: "")
                put("postTime", it.postTime)
                put("key", it.key)
            }
            pendingNotifications.add(notif)
            if (pendingNotifications.size > 100) {
                pendingNotifications.removeAt(0)
            }
            sendEvent("onNotificationReceived", notif.toString())
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {}

    private fun sendEvent(eventName: String, params: String) {
        val reactContext = (application as? MainApplication)?.reactNativeHost?.reactInstanceManager?.currentReactContext
        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit(eventName, params)
    }
}

class NotificationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "NotificationManager"

    @ReactMethod
    fun getPendingNotifications(promise: Promise) {
        val arr = JSONArray()
        ManuNotificationListener.pendingNotifications.forEach { arr.put(it) }
        promise.resolve(arr.toString())
    }

    @ReactMethod
    fun clearNotifications(promise: Promise) {
        ManuNotificationListener.pendingNotifications.clear()
        promise.resolve(true)
    }

    @ReactMethod
    fun requestNotificationAccess(promise: Promise) {
        try {
            val intent = Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
