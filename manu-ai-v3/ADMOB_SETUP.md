# AdMob Setup Guide for MANU AI

## Quick Setup (3 Steps)

### 1. Create AdMob Account
- Go to https://admob.google.com
- Sign in with your Google account
- Complete account setup

### 2. Create App in AdMob
- Click "Apps" → "Add App"
- Select "Android"
- Enter app name: "MANU AI"
- Package name: `com.manu.ai`
- Note down the **App ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)

### 3. Create Ad Units

#### Banner Ad
- Apps → MANU AI → Ad Units → Add Ad Unit → Banner
- Name: "MANU AI Banner"
- Note the **Ad Unit ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`)

#### Interstitial Ad
- Apps → MANU AI → Ad Units → Add Ad Unit → Interstitial
- Name: "MANU AI Interstitial"
- Note the **Ad Unit ID**

#### Rewarded Ad
- Apps → MANU AI → Ad Units → Add Ad Unit → Rewarded
- Name: "MANU AI Rewarded"
- Note the **Ad Unit ID**

#### App Open Ad
- Apps → MANU AI → Ad Units → Add Ad Unit → App Open
- Name: "MANU AI App Open"
- Note the **Ad Unit ID**

## Update Ad Unit IDs in Code

Open `src/services/ads.ts` and replace the IDs:

```typescript
const PUBLISHER_ID = 'ca-app-pub-YOUR_PUBLISHER_ID';

const PROD_BANNER_UNIT_ID = `${PUBLISHER_ID}/YOUR_BANNER_ID`;
const PROD_INTERSTITIAL_UNIT_ID = `${PUBLISHER_ID}/YOUR_INTERSTITIAL_ID`;
const PROD_REWARDED_UNIT_ID = `${PUBLISHER_ID}/YOUR_REWARDED_ID`;
const PROD_APP_OPEN_UNIT_ID = `${PUBLISHER_ID}/YOUR_APP_OPEN_ID`;
```

Also update `app.json`:

```json
{
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-YOUR_PUBLISHER_ID~YOUR_APP_ID"
  }
}
```

And `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-YOUR_PUBLISHER_ID~YOUR_APP_ID" />
```

## Ad Placement Strategy

### Banner Ads
- **Location**: Bottom of ChatScreen, ToolsScreen, DashboardScreen
- **Frequency**: Always visible
- **Revenue**: Low per impression, but consistent

### Interstitial Ads
- **Location**: Between screen transitions
- **Frequency**: Every 3-5 screen changes (with 60s cooldown)
- **Revenue**: Medium per impression

### Rewarded Ads
- **Location**: Avatar change, premium features unlock
- **Frequency**: User-initiated only
- **Revenue**: High per impression, user engagement high

### App Open Ads
- **Location**: App cold start
- **Frequency**: Once per session
- **Revenue**: Medium per impression

## Testing

During development, test ads automatically show (no real revenue). To test with your real ad units:

1. Add your test device ID in `src/services/ads.ts`:

```typescript
testDeviceIdentifiers: ['YOUR_DEVICE_ID_HERE'],
```

Get your device ID from Logcat:
```bash
adb logcat | grep "Device ID"
```

## Revenue Optimization Tips

1. **Banner**: Place at bottom where users naturally look
2. **Interstitial**: Show after user completes a task (not during)
3. **Rewarded**: Offer real value (avatar unlock, premium feature)
4. **App Open**: Don't delay app launch - show after splash

## Compliance

- Add privacy policy URL in AdMob dashboard
- Enable GDPR compliance in AdMob settings
- Add app-ads.txt file to your website
- Follow Google AdMob policies strictly

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Ads not showing | Check App ID and Ad Unit IDs are correct |
| Test ads showing in release | Remove test device IDs |
| Low fill rate | Enable all ad networks in mediation |
| Ad limit reached | Wait for Google review (new accounts) |
| App rejected | Check AdMob policies compliance |

## Estimated Revenue

| Ad Type | eCPM (India) | Daily Impressions | Monthly Revenue |
|---------|-------------|-------------------|-----------------|
| Banner | $0.10-0.30 | 10,000 | $30-90 |
| Interstitial | $0.50-1.50 | 5,000 | $75-225 |
| Rewarded | $2.00-5.00 | 2,000 | $120-300 |
| App Open | $0.30-0.80 | 3,000 | $27-72 |

**Total Estimated: $252-687/month** (with 10K DAU)

## Next Steps

1. Replace all test IDs with production IDs
2. Build release APK
3. Test on real device
4. Publish to Play Store
5. Monitor AdMob dashboard for revenue
