import React, {useEffect} from 'react';
import {StatusBar, View, StyleSheet, AppState, AppStateStatus} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './navigation/AppNavigator';
import {useStore} from './store/useStore';
import {initializeAds, showAppOpenAd} from './services/ads';

export default function App() {
  const {loadSettings} = useStore();
  const appState = React.useRef(AppState.currentState);

  useEffect(() => {
    loadSettings();

    // Initialize ads then show App Open Ad on first launch
    initializeAds()
      .then(() => {
        // Small delay so app UI renders first
        setTimeout(() => showAppOpenAd(), 1500);
      })
      .catch(console.error);

    // Show App Open Ad when app comes to foreground from background
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        showAppOpenAd().catch(() => {});
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [loadSettings]);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f1e" />
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
});
