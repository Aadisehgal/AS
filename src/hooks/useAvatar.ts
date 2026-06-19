import {useState, useCallback, useEffect} from 'react';
import {useStore} from '../store/useStore';
import {loadRewardedAd, showRewardedAd} from '../services/ads';

const AVATARS = [
  {name: 'Aria', file: 'aria.glb', color: '#FF6B9D'},
  {name: 'Luna', file: 'luna.glb', color: '#4ECDC4'},
  {name: 'Nova', file: 'nova.glb', color: '#FFE66D'},
  {name: 'Vega', file: 'vega.glb', color: '#95E1D3'},
  {name: 'Zara', file: 'zara.glb', color: '#F38181'},
];

export function useAvatar() {
  const {settings, setSettings} = useStore();
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  const currentAvatar = AVATARS.find(a => a.name.toLowerCase() === settings.currentAvatar) || AVATARS[0];

  const changeAvatar = useCallback(async (avatarName: string) => {
    if (avatarName === settings.currentAvatar) return;

    setIsAdLoading(true);
    setAdError(null);

    try {
      // Try to load rewarded ad
      const adLoaded = await loadRewardedAd();

      if (adLoaded) {
        const rewarded = await showRewardedAd();
        if (rewarded.success) {
          setSettings({currentAvatar: avatarName});
        } else {
          setAdError('Ad was not completed. Avatar change cancelled.');
        }
      } else {
        // Ad didn't load within 30 seconds, allow free change
        setSettings({currentAvatar: avatarName});
      }
    } catch (error) {
      // On error, allow free change
      setSettings({currentAvatar: avatarName});
    } finally {
      setIsAdLoading(false);
    }
  }, [settings.currentAvatar, setSettings]);

  return {
    avatars: AVATARS,
    currentAvatar,
    changeAvatar,
    isAdLoading,
    adError,
  };
}
