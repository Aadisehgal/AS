import type {AppInfo, Contact} from '../types';

interface CommandResult {
  type: string;
  action: string;
  params: Record<string, any>;
  confidence: number;
}

const APP_NAME_MAP: Record<string, string> = {
  'whatsapp': 'com.whatsapp',
  'youtube': 'com.google.android.youtube',
  'tiktok': 'com.zhiliaoapp.musically',
  'facebook': 'com.facebook.katana',
  'instagram': 'com.instagram.android',
  'twitter': 'com.twitter.android',
  'chrome': 'com.android.chrome',
  'gallery': 'com.android.gallery3d',
  'camera': 'com.android.camera',
  'phone': 'com.android.dialer',
  'messages': 'com.android.messaging',
  'settings': 'com.android.settings',
  'calendar': 'com.android.calendar',
  'clock': 'com.android.deskclock',
  'maps': 'com.google.android.apps.maps',
  'gmail': 'com.google.android.gm',
  'play store': 'com.android.vending',
};

export function parseVoiceCommand(
  text: string,
  language: string,
  installedApps: AppInfo[],
  contacts: Contact[],
): CommandResult | null {
  const lowerText = text.toLowerCase().trim();

  // Check for app opening commands
  for (const [appName, packageName] of Object.entries(APP_NAME_MAP)) {
    if (lowerText.includes(appName) && (lowerText.includes('open') || lowerText.includes('kholo') || lowerText.includes('khol') || lowerText.includes('start'))) {
      return {
        type: 'app',
        action: 'open',
        params: {packageName, appName},
        confidence: 0.9,
      };
    }
  }

  // Check installed apps
  for (const app of installedApps) {
    const appNameLower = app.appName.toLowerCase();
    if (lowerText.includes(appNameLower) && (lowerText.includes('open') || lowerText.includes('kholo') || lowerText.includes('khol'))) {
      return {
        type: 'app',
        action: 'open',
        params: {packageName: app.packageName, appName: app.appName},
        confidence: 0.85,
      };
    }
  }

  // Call commands
  if (lowerText.includes('call') || lowerText.includes('phone')) {
    for (const contact of contacts) {
      if (lowerText.includes(contact.name.toLowerCase())) {
        return {
          type: 'phone',
          action: 'call',
          params: {phoneNumber: contact.phoneNumber, name: contact.name},
          confidence: 0.9,
        };
      }
    }
    // Extract phone number
    const phoneMatch = lowerText.match(/(\d{10,})/);
    if (phoneMatch) {
      return {
        type: 'phone',
        action: 'call',
        params: {phoneNumber: phoneMatch[1]},
        confidence: 0.8,
      };
    }
  }

  // Message commands
  if (lowerText.includes('message') || lowerText.includes('sms') || lowerText.includes('text') || lowerText.includes('msg')) {
    for (const contact of contacts) {
      if (lowerText.includes(contact.name.toLowerCase())) {
        return {
          type: 'phone',
          action: 'sms',
          params: {
            phoneNumber: contact.phoneNumber,
            name: contact.name,
            message: '',
          },
          confidence: 0.8,
        };
      }
    }
  }

  // Flashlight commands
  if (lowerText.includes('flashlight') || lowerText.includes('torch') || lowerText.includes('flash') || lowerText.includes('light')) {
    const turnOn = lowerText.includes('on') || lowerText.includes('chalu') || lowerText.includes('start');
    const turnOff = lowerText.includes('off') || lowerText.includes('band') || lowerText.includes('stop');
    return {
      type: 'system',
      action: 'flashlight',
      params: {enable: turnOn || !turnOff},
      confidence: 0.85,
    };
  }

  // Volume commands
  if (lowerText.includes('volume') || lowerText.includes('sound')) {
    const numMatch = lowerText.match(/(\d+)/);
    if (numMatch) {
      return {
        type: 'system',
        action: 'volume',
        params: {level: parseInt(numMatch[1], 10)},
        confidence: 0.9,
      };
    }
  }

  // YouTube commands
  if (lowerText.includes('youtube') || lowerText.includes('video') || lowerText.includes('yt')) {
    const searchMatch = lowerText.match(/(?:search|find|play|dhoondo)\s+(.+)/i);
    if (searchMatch) {
      return {
        type: 'youtube',
        action: 'search',
        params: {query: searchMatch[1]},
        confidence: 0.85,
      };
    }
  }

  // WhatsApp commands
  if (lowerText.includes('whatsapp')) {
    if (lowerText.includes('status') || lowerText.includes('story')) {
      return {
        type: 'whatsapp',
        action: 'status',
        params: {},
        confidence: 0.9,
      };
    }
    for (const contact of contacts) {
      if (lowerText.includes(contact.name.toLowerCase())) {
        return {
          type: 'whatsapp',
          action: 'chat',
          params: {phoneNumber: contact.phoneNumber, name: contact.name},
          confidence: 0.85,
        };
      }
    }
  }

  // TikTok commands
  if (lowerText.includes('tiktok') || lowerText.includes('ticktok')) {
    return {
      type: 'app',
      action: 'open',
      params: {packageName: 'com.zhiliaoapp.musically', appName: 'TikTok'},
      confidence: 0.9,
    };
  }

  return null;
}

export function executeCommand(
  command: CommandResult,
  handlers: {
    openApp: (packageName: string) => Promise<void>;
    makeCall: (phoneNumber: string) => Promise<void>;
    sendSMS: (phoneNumber: string, message: string) => Promise<void>;
    toggleFlashlight: (enable: boolean) => Promise<void>;
    setVolume: (level: number) => Promise<void>;
    openYouTubeSearch: (query: string) => Promise<void>;
    openWhatsAppChat: (phoneNumber: string) => Promise<void>;
    openWhatsAppStatus: () => Promise<void>;
    openTikTok: () => Promise<void>;
  },
): Promise<string> {
  return new Promise(async (resolve) => {
    try {
      switch (command.type) {
        case 'app':
          await handlers.openApp(command.params.packageName);
          resolve(`Opened ${command.params.appName}`);
          break;
        case 'phone':
          if (command.action === 'call') {
            await handlers.makeCall(command.params.phoneNumber);
            resolve(`Calling ${command.params.name || command.params.phoneNumber}`);
          } else if (command.action === 'sms') {
            await handlers.sendSMS(command.params.phoneNumber, command.params.message || '');
            resolve(`Messaging ${command.params.name || command.params.phoneNumber}`);
          }
          break;
        case 'system':
          if (command.action === 'flashlight') {
            await handlers.toggleFlashlight(command.params.enable);
            resolve(command.params.enable ? 'Flashlight turned on' : 'Flashlight turned off');
          } else if (command.action === 'volume') {
            await handlers.setVolume(command.params.level);
            resolve(`Volume set to ${command.params.level}%`);
          }
          break;
        case 'youtube':
          await handlers.openYouTubeSearch(command.params.query);
          resolve(`Searching YouTube for ${command.params.query}`);
          break;
        case 'whatsapp':
          if (command.action === 'status') {
            await handlers.openWhatsAppStatus();
            resolve('Opening WhatsApp status');
          } else {
            await handlers.openWhatsAppChat(command.params.phoneNumber);
            resolve(`Opening WhatsApp chat with ${command.params.name}`);
          }
          break;
        default:
          resolve('Command not recognized');
      }
    } catch (error) {
      resolve(`Error: ${error}`);
    }
  });
}
