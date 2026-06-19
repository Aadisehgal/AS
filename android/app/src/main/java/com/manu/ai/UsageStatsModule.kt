package com.manu.ai

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

class UsageStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "UsageStatsManager"

    @ReactMethod
    fun getAppUsage(hours: Int, promise: Promise) {
        try {
            val usm = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            calendar.add(Calendar.HOUR, -hours)
            val startTime = calendar.timeInMillis

            val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
            val result = JSONArray()

            stats?.forEach { stat ->
                if (stat.totalTimeInForeground > 0) {
                    val obj = JSONObject().apply {
                        put("packageName", stat.packageName)
                        put("totalTimeInForeground", stat.totalTimeInForeground)
                        put("lastTimeUsed", stat.lastTimeUsed)
                    }
                    result.put(obj)
                }
            }
            promise.resolve(result.toString())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestUsageAccess(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
