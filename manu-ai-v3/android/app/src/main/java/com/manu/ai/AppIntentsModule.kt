package com.manu.ai

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.ContactsContract
import android.provider.Settings
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.os.Build
import android.location.LocationManager
import android.location.Location
import android.location.LocationListener
import android.os.Bundle
import android.os.Looper
import android.content.ClipboardManager
import android.content.ClipData
import android.net.wifi.WifiManager
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.graphics.Bitmap
import android.graphics.Color
import android.provider.MediaStore
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import androidx.core.content.FileProvider
import android.os.Environment
import java.io.File
import java.io.FileOutputStream
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject

class AppIntentsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppIntents"

    // ======== EXISTING METHODS ========
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val apps = JSONArray()
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            for (appInfo in packages) {
                if (pm.getLaunchIntentForPackage(appInfo.packageName) != null) {
                    val app = JSONObject()
                    app.put("packageName", appInfo.packageName)
                    app.put("appName", pm.getApplicationLabel(appInfo).toString())
                    app.put("isSystemApp", (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0)
                    apps.put(app)
                }
            }
            promise.resolve(apps.toString())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openApp(packageName: String, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val intent = pm.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.reject("NOT_FOUND", "App not found: $packageName")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openWhatsAppChat(phoneNumber: String, message: String?, promise: Promise) {
        try {
            val uri = if (message != null && message.isNotEmpty()) {
                Uri.parse("https://api.whatsapp.com/send?phone=$phoneNumber&text=${Uri.encode(message)}")
            } else {
                Uri.parse("https://api.whatsapp.com/send?phone=$phoneNumber")
            }
            val intent = Intent(Intent.ACTION_VIEW, uri)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openWhatsAppCall(phoneNumber: String, isVideo: Boolean, promise: Promise) {
        try {
            val intent = Intent()
            intent.action = Intent.ACTION_VIEW
            val uri = Uri.parse("https://wa.me/$phoneNumber?call")
            intent.data = uri
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openWhatsAppStatus(promise: Promise) {
        try {
            val intent = Intent()
            intent.action = "android.intent.action.VIEW"
            intent.setPackage("com.whatsapp")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openTikTok(promise: Promise) {
        try {
            val intent = Intent()
            intent.setPackage("com.zhiliaoapp.musically")
            intent.action = Intent.ACTION_MAIN
            intent.addCategory(Intent.CATEGORY_LAUNCHER)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openYouTubeSearch(query: String, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_SEARCH)
            intent.setPackage("com.google.android.youtube")
            intent.putExtra("query", query)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openYouTubeVideo(videoId: String, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("vnd.youtube:$videoId"))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun makePhoneCall(phoneNumber: String, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_DIAL)
            intent.data = Uri.parse("tel:$phoneNumber")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun sendSMS(phoneNumber: String, message: String, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_SENDTO)
            intent.data = Uri.parse("smsto:$phoneNumber")
            intent.putExtra("sms_body", message)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun toggleFlashlight(enable: Boolean, promise: Promise) {
        try {
            val cameraManager = reactApplicationContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            val cameraId = cameraManager.cameraIdList[0]
            cameraManager.setTorchMode(cameraId, enable)
            promise.resolve(true)
        } catch (e: CameraAccessException) {
            promise.reject("ERROR", e.message)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setVolume(level: Int, promise: Promise) {
        try {
            val audioManager = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val targetVolume = (level * maxVolume / 100).coerceIn(0, maxVolume)
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, targetVolume, AudioManager.FLAG_SHOW_UI)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getContacts(promise: Promise) {
        try {
            val contacts = JSONArray()
            val cursor = reactApplicationContext.contentResolver.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                null, null, null, null
            )
            cursor?.use {
                while (it.moveToNext()) {
                    val contact = JSONObject()
                    val nameIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                    val numberIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                    if (nameIndex >= 0 && numberIndex >= 0) {
                        contact.put("name", it.getString(nameIndex))
                        contact.put("phoneNumber", it.getString(numberIndex).replace("\\s".toRegex(), ""))
                        contacts.put(contact)
                    }
                }
            }
            promise.resolve(contacts.toString())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openAppSettings(packageName: String, promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            intent.data = Uri.parse("package:$packageName")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // ======== NEW ADVANCED METHODS ========

    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        try {
            val locationManager = reactApplicationContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val location: Location? = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                ?: locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)

            val result = JSONObject()
            if (location != null) {
                result.put("latitude", location.latitude)
                result.put("longitude", location.longitude)
                result.put("accuracy", location.accuracy)
                result.put("timestamp", location.time)
            } else {
                result.put("latitude", 0.0)
                result.put("longitude", 0.0)
                result.put("accuracy", 0.0)
                result.put("timestamp", 0)
            }
            promise.resolve(result.toString())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getClipboardText(promise: Promise) {
        try {
            val clipboard = reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = clipboard.primaryClip
            val text = if (clip != null && clip.itemCount > 0) {
                clip.getItemAt(0).text?.toString() ?: ""
            } else {
                ""
            }
            promise.resolve(text)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setClipboardText(text: String, promise: Promise) {
        try {
            val clipboard = reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("MANU AI", text))
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun generateQRCode(text: String, size: Int, promise: Promise) {
        try {
            val writer = QRCodeWriter()
            val bitMatrix = writer.encode(text, BarcodeFormat.QR_CODE, size, size)
            val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
            for (x in 0 until size) {
                for (y in 0 until size) {
                    bmp.setPixel(x, y, if (bitMatrix.get(x, y)) Color.BLACK else Color.WHITE)
                }
            }
            val file = File(reactApplicationContext.cacheDir, "qrcode_${System.currentTimeMillis()}.png")
            FileOutputStream(file).use { out ->
                bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            promise.resolve(file.absolutePath)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun scanQRCode(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("ERROR", "No active activity")
                return
            }
            pendingQrPromise = promise
            val intent = Intent("com.google.zxing.client.android.SCAN")
            intent.putExtra("SCAN_MODE", "QR_CODE_MODE")
            activity.startActivityForResult(intent, REQUEST_QR_SCAN)
        } catch (e: Exception) {
            // ZXing Barcode Scanner app not installed — fall back to Play Store prompt
            try {
                val marketIntent = Intent(Intent.ACTION_VIEW)
                marketIntent.data = Uri.parse("market://details?id=com.google.zxing.client.android")
                marketIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(marketIntent)
            } catch (e2: Exception) { /* ignore */ }
            promise.reject("NO_SCANNER", "No QR scanner app installed. Please install 'Barcode Scanner' from Play Store.")
        }
    }

    @ReactMethod
    fun scanWiFiNetworks(promise: Promise) {
        try {
            val wifiManager = reactApplicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val results = wifiManager.scanResults
            val networks = JSONArray()
            for (result in results) {
                val network = JSONObject()
                network.put("ssid", result.SSID)
                network.put("bssid", result.BSSID)
                network.put("frequency", result.frequency)
                network.put("level", result.level)
                network.put("capabilities", result.capabilities)
                networks.put(network)
            }
            promise.resolve(networks.toString())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getWiFiInfo(promise: Promise) {
        try {
            val wifiManager = reactApplicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val info = wifiManager.connectionInfo
            val result = JSONObject()
            result.put("ssid", info.ssid)
            result.put("bssid", info.bssid)
            result.put("ipAddress", info.ipAddress)
            result.put("linkSpeed", info.linkSpeed)
            result.put("rssi", info.rssi)
            result.put("networkId", info.networkId)
            promise.resolve(result.toString())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun scanBluetoothDevices(promise: Promise) {
        try {
            val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
            val devices = JSONArray()
            if (bluetoothAdapter != null && bluetoothAdapter.isEnabled) {
                val pairedDevices = bluetoothAdapter.bondedDevices
                for (device in pairedDevices) {
                    val dev = JSONObject()
                    dev.put("name", device.name ?: "Unknown")
                    dev.put("address", device.address)
                    dev.put("type", device.type.toString())
                    devices.put(dev)
                }
            }
            promise.resolve(devices.toString())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getSensorData(promise: Promise) {
        try {
            val sensorManager = reactApplicationContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
            val result = JSONObject()
            val sensorsToRead = mutableListOf<Pair<Int, String>>()

            sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.let { sensorsToRead.add(Sensor.TYPE_ACCELEROMETER to "accelerometer") }
            sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)?.let { sensorsToRead.add(Sensor.TYPE_GYROSCOPE to "gyroscope") }
            sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)?.let { sensorsToRead.add(Sensor.TYPE_MAGNETIC_FIELD to "magnetometer") }
            sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY)?.let { sensorsToRead.add(Sensor.TYPE_PROXIMITY to "proximity") }
            sensorManager.getDefaultSensor(Sensor.TYPE_LIGHT)?.let { sensorsToRead.add(Sensor.TYPE_LIGHT to "light") }

            if (sensorsToRead.isEmpty()) {
                promise.resolve(result.toString())
                return
            }

            var remaining = sensorsToRead.size
            val listener = object : SensorEventListener {
                override fun onSensorChanged(event: SensorEvent) {
                    synchronized(result) {
                        when (event.sensor.type) {
                            Sensor.TYPE_ACCELEROMETER -> {
                                val v = JSONObject(); v.put("x", event.values[0]); v.put("y", event.values[1]); v.put("z", event.values[2])
                                if (!result.has("accelerometer")) { result.put("accelerometer", v); remaining-- }
                            }
                            Sensor.TYPE_GYROSCOPE -> {
                                val v = JSONObject(); v.put("x", event.values[0]); v.put("y", event.values[1]); v.put("z", event.values[2])
                                if (!result.has("gyroscope")) { result.put("gyroscope", v); remaining-- }
                            }
                            Sensor.TYPE_MAGNETIC_FIELD -> {
                                val v = JSONObject(); v.put("x", event.values[0]); v.put("y", event.values[1]); v.put("z", event.values[2])
                                if (!result.has("magnetometer")) { result.put("magnetometer", v); remaining-- }
                            }
                            Sensor.TYPE_PROXIMITY -> {
                                if (!result.has("proximity")) { result.put("proximity", event.values[0]); remaining-- }
                            }
                            Sensor.TYPE_LIGHT -> {
                                if (!result.has("light")) { result.put("light", event.values[0]); remaining-- }
                            }
                        }
                        if (remaining <= 0) {
                            sensorManager.unregisterListener(this)
                            promise.resolve(result.toString())
                        }
                    }
                }
                override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}
            }

            for ((type, _) in sensorsToRead) {
                sensorManager.registerListener(listener, sensorManager.getDefaultSensor(type), SensorManager.SENSOR_DELAY_NORMAL)
            }

            // Safety timeout — resolve with whatever we have after 1.5s (e.g. proximity may not fire without state change)
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                synchronized(result) {
                    if (remaining > 0) {
                        sensorManager.unregisterListener(listener)
                        promise.resolve(result.toString())
                    }
                }
            }, 1500)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun captureAndRecognizeText(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("ERROR", "No active activity")
                return
            }
            val photoFile = File(reactApplicationContext.cacheDir, "ocr_capture_${System.currentTimeMillis()}.jpg")
            val photoUri = FileProvider.getUriForFile(
                reactApplicationContext,
                "com.manu.ai.fileprovider",
                photoFile
            )
            pendingOcrPromise = promise
            pendingOcrFile = photoFile

            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            intent.putExtra(MediaStore.EXTRA_OUTPUT, photoUri)
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            activity.startActivityForResult(intent, REQUEST_OCR_CAPTURE)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun startAROverlay(promise: Promise) {
        // AR overlay rendering (ARCore) is not implemented yet.
        // Previously this incorrectly sent the user to the Home screen — removed.
        promise.reject("NOT_IMPLEMENTED", "AR Overlay is not available yet in this version.")
    }

    @ReactMethod
    fun stopAROverlay(promise: Promise) {
        promise.resolve(true)
    }

    // ======== ACTIVITY RESULT HANDLING (QR scan + OCR capture) ========
    companion object {
        const val REQUEST_QR_SCAN = 4201
        const val REQUEST_OCR_CAPTURE = 4202

        private var pendingQrPromise: Promise? = null
        private var pendingOcrPromise: Promise? = null
        private var pendingOcrFile: File? = null

        fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
            when (requestCode) {
                REQUEST_QR_SCAN -> {
                    val promise = pendingQrPromise
                    pendingQrPromise = null
                    if (promise == null) return
                    if (resultCode == android.app.Activity.RESULT_OK && data != null) {
                        val contents = data.getStringExtra("SCAN_RESULT")
                        if (contents != null) {
                            promise.resolve(contents)
                        } else {
                            promise.reject("NO_RESULT", "No QR content found in scan result")
                        }
                    } else {
                        promise.reject("CANCELLED", "QR scan was cancelled")
                    }
                }
                REQUEST_OCR_CAPTURE -> {
                    val promise = pendingOcrPromise
                    val file = pendingOcrFile
                    pendingOcrPromise = null
                    pendingOcrFile = null
                    if (promise == null) return

                    if (resultCode == android.app.Activity.RESULT_OK && file != null && file.exists()) {
                        try {
                            val bitmap = android.graphics.BitmapFactory.decodeFile(file.absolutePath)
                            if (bitmap == null) {
                                promise.reject("ERROR", "Failed to decode captured image")
                                return
                            }
                            val image = InputImage.fromBitmap(bitmap, 0)
                            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                            recognizer.process(image)
                                .addOnSuccessListener { visionText ->
                                    file.delete()
                                    promise.resolve(visionText.text)
                                }
                                .addOnFailureListener { e ->
                                    file.delete()
                                    promise.reject("OCR_FAILED", e.message)
                                }
                        } catch (e: Exception) {
                            file.delete()
                            promise.reject("ERROR", e.message)
                        }
                    } else {
                        file?.delete()
                        promise.reject("CANCELLED", "Photo capture was cancelled")
                    }
                }
            }
        }
    }
}
