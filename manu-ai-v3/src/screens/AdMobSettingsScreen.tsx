import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  initializeAds,
  getAdStats,
  resetAdStats,
  showInterstitialAd,
  showRewardedAd,
  showAppOpenAd,
  loadInterstitialAd,
  loadRewardedAd,
  loadAppOpenAd,
  AD_UNIT_IDS,
} from '../services/ads';
import {BannerAdComponent} from '../components/BannerAdComponent';

export function AdMobSettingsScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<any>(null);
  const [adEnabled, setAdEnabled] = useState(true);
  const [testMode, setTestMode] = useState(__DEV__);
  const [cooldown, setCooldown] = useState('60');

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshStats = () => {
    setStats(getAdStats());
  };

  const handleShowInterstitial = async () => {
    const shown = await showInterstitialAd();
    Alert.alert(shown ? 'Success' : 'Failed', shown ? 'Interstitial ad shown' : 'Could not show ad');
  };

  const handleShowRewarded = async () => {
    const result = await showRewardedAd();
    Alert.alert(
      result.success ? 'Reward Earned!' : 'Failed',
      result.success ? `You earned: ${result.reward?.amount} ${result.reward?.type}` : 'Could not show rewarded ad'
    );
  };

  const handleShowAppOpen = async () => {
    const shown = await showAppOpenAd();
    Alert.alert(shown ? 'Success' : 'Failed', shown ? 'App Open ad shown' : 'Could not show ad');
  };

  const handleResetStats = () => {
    resetAdStats();
    refreshStats();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AdMob Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Ad Unit IDs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Unit IDs</Text>
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>Banner:</Text>
            <Text style={styles.idValue} selectable>{AD_UNIT_IDS.banner}</Text>
          </View>
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>Interstitial:</Text>
            <Text style={styles.idValue} selectable>{AD_UNIT_IDS.interstitial}</Text>
          </View>
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>Rewarded:</Text>
            <Text style={styles.idValue} selectable>{AD_UNIT_IDS.rewarded}</Text>
          </View>
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>App Open:</Text>
            <Text style={styles.idValue} selectable>{AD_UNIT_IDS.appOpen}</Text>
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Ads Enabled</Text>
            <Switch value={adEnabled} onValueChange={setAdEnabled} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Test Mode</Text>
            <Switch value={testMode} onValueChange={setTestMode} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Banner Impressions:</Text>
            <Text style={styles.statValue}>{stats?.bannerImpressions || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Interstitial Impressions:</Text>
            <Text style={styles.statValue}>{stats?.interstitialImpressions || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Rewarded Impressions:</Text>
            <Text style={styles.statValue}>{stats?.rewardedImpressions || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>App Open Impressions:</Text>
            <Text style={styles.statValue}>{stats?.appOpenImpressions || 0}</Text>
          </View>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetStats}>
            <Text style={styles.resetButtonText}>Reset Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Test Ads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Ad Placements</Text>
          <TouchableOpacity style={styles.testButton} onPress={handleShowInterstitial}>
            <Text style={styles.testButtonText}>Show Interstitial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={handleShowRewarded}>
            <Text style={styles.testButtonText}>Show Rewarded</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={handleShowAppOpen}>
            <Text style={styles.testButtonText}>Show App Open</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banner Preview</Text>
          <BannerAdComponent />
        </View>
      </ScrollView>
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
  idBox: {
    marginBottom: 8,
  },
  idLabel: {
    color: '#888',
    fontSize: 12,
  },
  idValue: {
    color: '#4ECDC4',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 13,
  },
  statValue: {
    color: '#4ECDC4',
    fontSize: 13,
    fontWeight: 'bold',
  },
  resetButton: {
    marginTop: 12,
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
