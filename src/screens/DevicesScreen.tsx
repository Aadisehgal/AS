import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {scanWiFiNetworks, getWiFiInfo} from '../services/wifi';
import {scanBluetoothDevices} from '../services/bluetooth';
import {getSensorData} from '../services/sensors';
import {BannerAdComponent} from '../components/BannerAdComponent';

export function DevicesScreen() {
  const navigation = useNavigation();
  const [wifiNetworks, setWifiNetworks] = useState<any[]>([]);
  const [bluetoothDevices, setBluetoothDevices] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any>(null);
  const [wifiInfo, setWifiInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const scanWiFi = async () => {
    setLoading(true);
    const networks = await scanWiFiNetworks();
    setWifiNetworks(networks);
    const info = await getWiFiInfo();
    setWifiInfo(info);
    setLoading(false);
  };

  const scanBluetooth = async () => {
    setLoading(true);
    const devices = await scanBluetoothDevices();
    setBluetoothDevices(devices);
    setLoading(false);
  };

  const readSensors = async () => {
    setLoading(true);
    const data = await getSensorData();
    setSensors(data);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device Scanner</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* WiFi Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WiFi Networks</Text>
          {wifiInfo && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Connected: {wifiInfo.ssid}</Text>
              <Text style={styles.infoText}>Signal: {wifiInfo.rssi} dBm</Text>
              <Text style={styles.infoText}>Speed: {wifiInfo.linkSpeed} Mbps</Text>
            </View>
          )}
          <TouchableOpacity style={styles.scanButton} onPress={scanWiFi}>
            <Text style={styles.scanButtonText}>Scan WiFi</Text>
          </TouchableOpacity>
          {wifiNetworks.map((net, i) => (
            <View key={i} style={styles.deviceItem}>
              <Text style={styles.deviceName}>{net.ssid || 'Hidden'}</Text>
              <Text style={styles.deviceSignal}>{net.level} dBm</Text>
            </View>
          ))}
        </View>

        {/* Bluetooth Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bluetooth Devices</Text>
          <TouchableOpacity style={styles.scanButton} onPress={scanBluetooth}>
            <Text style={styles.scanButtonText}>Scan Bluetooth</Text>
          </TouchableOpacity>
          {bluetoothDevices.map((dev, i) => (
            <View key={i} style={styles.deviceItem}>
              <Text style={styles.deviceName}>{dev.name}</Text>
              <Text style={styles.deviceSignal}>{dev.address}</Text>
            </View>
          ))}
        </View>

        {/* Sensors Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Sensors</Text>
          <TouchableOpacity style={styles.scanButton} onPress={readSensors}>
            <Text style={styles.scanButtonText}>Read Sensors</Text>
          </TouchableOpacity>
          {sensors && (
            <View style={styles.sensorBox}>
              <Text style={styles.sensorText}>Accelerometer: {sensors.accelerometer ? 'Available' : 'N/A'}</Text>
              <Text style={styles.sensorText}>Gyroscope: {sensors.gyroscope ? 'Available' : 'N/A'}</Text>
              <Text style={styles.sensorText}>Magnetometer: {sensors.magnetometer ? 'Available' : 'N/A'}</Text>
              <Text style={styles.sensorText}>Proximity: {sensors.proximity !== undefined ? sensors.proximity : 'N/A'}</Text>
              <Text style={styles.sensorText}>Light: {sensors.light !== undefined ? sensors.light : 'N/A'}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {loading && <ActivityIndicator color="#4ECDC4" style={styles.loader} />}
      <BannerAdComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  backButton: {
    color: '#4ECDC4',
    fontSize: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#0f0f1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  scanButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  deviceName: {
    color: '#fff',
    fontSize: 14,
  },
  deviceSignal: {
    color: '#888',
    fontSize: 12,
  },
  sensorBox: {
    backgroundColor: '#0f0f1e',
    padding: 12,
    borderRadius: 8,
  },
  sensorText: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
});
