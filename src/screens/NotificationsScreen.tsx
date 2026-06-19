import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  getPendingNotifications,
  clearNotifications,
  requestNotificationAccess,
  onNotificationReceived,
} from '../services/notifications';
import {BannerAdComponent} from '../components/BannerAdComponent';

export function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();
    const listener = onNotificationReceived((notif) => {
      setNotifications(prev => [notif, ...prev]);
    });
    return () => listener.remove();
  }, []);

  const loadNotifications = async () => {
    const notifs = await getPendingNotifications();
    setNotifications(notifs.reverse());
  };

  const handleClear = async () => {
    await clearNotifications();
    setNotifications([]);
  };

  const handleRequestAccess = async () => {
    await requestNotificationAccess();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.accessButton} onPress={handleRequestAccess}>
        <Text style={styles.accessButtonText}>Enable Notification Access</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {notifications.length === 0 && (
          <Text style={styles.emptyText}>No notifications captured yet</Text>
        )}
        {notifications.map((notif, index) => (
          <View key={index} style={styles.notifCard}>
            <Text style={styles.notifPackage}>{notif.packageName}</Text>
            <Text style={styles.notifTitle}>{notif.title}</Text>
            <Text style={styles.notifText}>{notif.text}</Text>
            <Text style={styles.notifTime}>
              {new Date(notif.postTime).toLocaleTimeString()}
            </Text>
          </View>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  backButton: {
    color: '#4ECDC4',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  accessButton: {
    backgroundColor: '#2d2d44',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  accessButtonText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    padding: 40,
  },
  notifCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
  },
  notifPackage: {
    color: '#4ECDC4',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notifTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notifText: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  notifTime: {
    color: '#666',
    fontSize: 11,
  },
});
