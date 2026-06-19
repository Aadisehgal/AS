import React from 'react';
import {View, StyleSheet} from 'react-native';
import {BannerAd, BannerAdSize, getBannerAdUnitId, trackBannerImpression} from '../services/ads';

export function BannerAdComponent() {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={trackBannerImpression}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    width: '100%',
  },
});
