import {
  MobileAds,
  BannerAd,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  InterstitialAd,
  AdEventType,
  AppOpenAd,
  TestIds,
} from 'react-native-google-mobile-ads';

// ============================================
// AD UNIT IDs
// ============================================
const PUBLISHER_ID = 'ca-app-pub-3684441716460567';

const PROD_BANNER_UNIT_ID      = `${PUBLISHER_ID}/7116352504`;
const PROD_INTERSTITIAL_UNIT_ID = `${PUBLISHER_ID}/4188433698`;
const PROD_REWARDED_UNIT_ID    = `${PUBLISHER_ID}/7885822933`;
const PROD_APP_OPEN_UNIT_ID    = `${PUBLISHER_ID}/YOUR_APP_OPEN_ID`; // Replace with real App Open ID when created

const isDev = __DEV__;

export const AD_UNIT_IDS = {
  banner:       isDev ? TestIds.BANNER       : PROD_BANNER_UNIT_ID,
  interstitial: isDev ? TestIds.INTERSTITIAL : PROD_INTERSTITIAL_UNIT_ID,
  rewarded:     isDev ? TestIds.REWARDED     : PROD_REWARDED_UNIT_ID,
  appOpen:      isDev ? 'ca-app-pub-3940256099942544/9257395921' : PROD_APP_OPEN_UNIT_ID,
};

// ============================================
// AD STATE
// ============================================
let rewardedAd:     RewardedAd     | null = null;
let interstitialAd: InterstitialAd | null = null;
let appOpenAd:      AppOpenAd      | null = null;
let adsInitialized = false;

// ✅ Global "any ad just shown" timestamp — prevents AppOpen + Interstitial stacking
let lastAnyFullScreenAdShow = 0;
const FULL_SCREEN_AD_GUARD_MS = 60000; // 60s gap enforced between any two full-screen ads

let adStats = {
  bannerImpressions: 0,
  interstitialImpressions: 0,
  rewardedImpressions: 0,
  appOpenImpressions: 0,
};

// ============================================
// INITIALIZATION
// ============================================
export async function initializeAds(): Promise<void> {
  if (adsInitialized) return;
  try {
    await MobileAds().setRequestConfiguration({
      testDeviceIdentifiers: isDev ? ['EMULATOR'] : [],
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await MobileAds().initialize();
    adsInitialized = true;
    // Pre-load all ad types in background
    loadInterstitialAd();
    loadRewardedAd();
    loadAppOpenAd();
  } catch (error) {
    console.error('AdMob initialization failed:', error);
  }
}

// ============================================
// BANNER ADS
// ============================================
export function getBannerAdUnitId(): string {
  return AD_UNIT_IDS.banner;
}

export function getBannerSize() {
  return BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
}

export function trackBannerImpression(): void {
  adStats.bannerImpressions++;
}

// ============================================
// INTERSTITIAL ADS
// ============================================
export async function loadInterstitialAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (interstitialAd) { resolve(true); return; }

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialAd = ad;
      unsubLoaded();
      resolve(true);
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      unsubLoaded();
      resolve(false);
    });

    ad.load();
    setTimeout(() => { if (!interstitialAd) { unsubLoaded(); resolve(false); } }, 30000);
  });
}

export async function showInterstitialAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!interstitialAd) {
      loadInterstitialAd().then((loaded) => {
        if (loaded) showInterstitialAd().then(resolve);
        else resolve(false);
      });
      return;
    }

    const unsubClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialAd = null;
      adStats.interstitialImpressions++;
      unsubClosed();
      resolve(true);
      loadInterstitialAd(); // Pre-load next
    });
    const unsubError = interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      interstitialAd = null;
      unsubClosed();
      resolve(false);
    });

    interstitialAd.show();
  });
}

// Cooldown logic — 60s between interstitials, and respects global full-screen ad guard
let lastInterstitialShow = 0;
const INTERSTITIAL_COOLDOWN = 60000;

export async function showInterstitialWithCooldown(): Promise<boolean> {
  const now = Date.now();
  if (now - lastInterstitialShow < INTERSTITIAL_COOLDOWN) return false;
  // ✅ Skip if any full-screen ad (including AppOpen) was shown very recently
  if (now - lastAnyFullScreenAdShow < FULL_SCREEN_AD_GUARD_MS) return false;
  const shown = await showInterstitialAd();
  if (shown) {
    lastInterstitialShow = now;
    lastAnyFullScreenAdShow = now;
  }
  return shown;
}

// ============================================
// REWARDED ADS
// ============================================
export async function loadRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (rewardedAd) { resolve(true); return; }

    const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded);

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedAd = ad;
      unsubLoaded();
      resolve(true);
    });
    const unsubError = ad.addAdEventListener('error' as any, () => {
      unsubLoaded();
      resolve(false);
    });

    ad.load();
    setTimeout(() => { if (!rewardedAd) { unsubLoaded(); resolve(false); } }, 30000);
  });
}

export async function showRewardedAd(): Promise<{success: boolean; reward?: any}> {
  return new Promise((resolve) => {
    if (!rewardedAd) {
      loadRewardedAd().then((loaded) => {
        if (loaded) showRewardedAd().then(resolve);
        else resolve({success: false});
      });
      return;
    }

    const unsubEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        adStats.rewardedImpressions++;
        unsubEarned();
        rewardedAd = null;
        resolve({success: true, reward});
        loadRewardedAd();
      },
    );
    const unsubClosed = rewardedAd.addAdEventListener('closed' as any, () => {
      unsubEarned();
      rewardedAd = null;
      resolve({success: false});
    });

    rewardedAd.show();
  });
}

// ============================================
// APP OPEN ADS
// ============================================
export async function loadAppOpenAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (appOpenAd) { resolve(true); return; }

    const ad = AppOpenAd.createForAdRequest(AD_UNIT_IDS.appOpen);

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      appOpenAd = ad;
      unsubLoaded();
      resolve(true);
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      unsubLoaded();
      resolve(false);
    });

    ad.load();
    setTimeout(() => { if (!appOpenAd) { unsubLoaded(); resolve(false); } }, 30000);
  });
}

export async function showAppOpenAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!appOpenAd) {
      loadAppOpenAd().then((loaded) => {
        if (loaded) showAppOpenAd().then(resolve);
        else resolve(false);
      });
      return;
    }

    const unsubClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      appOpenAd = null;
      adStats.appOpenImpressions++;
      lastAnyFullScreenAdShow = Date.now();
      unsubClosed();
      resolve(true);
      loadAppOpenAd();
    });
    const unsubError = appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
      appOpenAd = null;
      resolve(false);
    });

    appOpenAd.show();
  });
}

// ============================================
// ANALYTICS
// ============================================
export function getAdStats() { return {...adStats}; }

export function resetAdStats() {
  adStats = { bannerImpressions: 0, interstitialImpressions: 0, rewardedImpressions: 0, appOpenImpressions: 0 };
}

// ============================================
// EXPORTS
// ============================================
export {BannerAd, BannerAdSize};
