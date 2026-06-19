import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useStore} from '../store/useStore';
import {getNetworkInfo} from '../utils/hackingTools';
import {getAppUsage} from '../services/usageStats';
import {getSensorData} from '../services/sensors';
import {getWiFiInfo} from '../services/wifi';
import {BannerAdComponent} from '../components/BannerAdComponent';
import {showInterstitialWithCooldown} from '../services/ads';

export function DashboardScreen() {
  const navigation = useNavigation();
  const {settings} = useStore();
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [appUsage, setAppUsage] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any>(null);
  const [wifi, setWifi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [net, usage, sens, wf] = await Promise.all([
        getNetworkInfo(),
        getAppUsage(24),
        getSensorData(),
        getWiFiInfo(),
      ]);
      setNetworkInfo(net);
      setAppUsage(usage.slice(0, 5));
      setSensors(sens);
      setWifi(wf);
    } catch (e) {
      console.log('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const widgets = [
    {id: 'chat', title: 'AI Chat', icon: 'Chat', screen: 'Chat', color: '#4ECDC4'},
    {id: 'tools', title: 'Hacking Tools', icon: 'Tools', screen: 'Tools', color: '#FF6B9D'},
    {id: 'memory', title: 'AI Memory', icon: 'Memory', screen: 'Memory', color: '#FFE66D'},
    {id: 'schedule', title: 'Scheduler', icon: 'Schedule', screen: 'Scheduler', color: '#95E1D3'},
    {id: 'files', title: 'File Manager', icon: 'Files', screen: 'FileManager', color: '#F38181'},
    {id: 'devices', title: 'Devices', icon: 'Devices', screen: 'Devices', color: '#A8E6CF'},
    {id: 'notifications', title: 'Notifications', icon: 'Bell', screen: 'Notifications', color: '#DCEDC1'},
    {id: 'admob', title: 'AdMob', icon: 'Ad', screen: 'AdMob', color: '#FFD3B6'},
    {id: 'settings', title: 'Settings', icon: 'Settings', screen: 'Settings', color: '#FFD3B6'},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MANU AI Dashboard</Text>
        <Text style={styles.greeting}>Hello, {settings.userName}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, {backgroundColor: '#2d2d44'}]}>
            <Text style={styles.statValue}>{appUsage.length}</Text>
            <Text style={styles.statLabel}>Apps Used</Text>
          </View>
          <View style={[styles.statCard, {backgroundColor: '#2d2d44'}]}>
            <Text style={styles.statValue}>{wifi?.ssid || 'N/A'}</Text>
            <Text style={styles.statLabel}>WiFi</Text>
          </View>
          <View style={[styles.statCard, {backgroundColor: '#2d2d44'}]}>
            <Text style={styles.statValue}>{networkInfo?.isConnected ? 'Yes' : 'No'}</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
        </View>

        {/* Widget Grid */}
        <View style={styles.widgetGrid}>
          {widgets.map((widget) => (
            <TouchableOpacity
              key={widget.id}
              style={[styles.widgetCard, {borderLeftColor: widget.color}]}
              onPress={async () => {
              if (widget.screen === 'Chat' || widget.screen === 'Tools') {
                showInterstitialWithCooldown().catch(() => {});
              }
              navigation.navigate(widget.screen as never);
            }}
            >
              <Text style={styles.widgetTitle}>{widget.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sensor Data */}
        {sensors && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Sensors</Text>
            <Text style={styles.sensorText}>Accelerometer: {sensors.accelerometer ? 'Available' : 'N/A'}</Text>
            <Text style={styles.sensorText}>Gyroscope: {sensors.gyroscope ? 'Available' : 'N/A'}</Text>
            <Text style={styles.sensorText}>Magnetometer: {sensors.magnetometer ? 'Available' : 'N/A'}</Text>
          </View>
        )}

        {/* App Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Apps (24h)</Text>
          {appUsage.map((app, index) => (
            <View key={index} style={styles.usageItem}>
              <Text style={styles.usageName}>{app.packageName}</Text>
              <Text style={styles.usageTime}>{(app.totalTimeInForeground / 60000).toFixed(1)}m</Text>
            </View>
          ))}
        </View>
      </ScrollView>

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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  widgetCard: {
    width: '47%',
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  widgetTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  sensorText: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  usageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  usageName: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
  },
  usageTime: {
    color: '#4ECDC4',
    fontSize: 13,
  },
});
