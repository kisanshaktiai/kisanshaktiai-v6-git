
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.84911d40aeb04c61933249a624485318',
  appName: 'KisanShaktiAI',
  webDir: 'dist',
  server: {
    url: 'https://84911d40-aeb0-4c61-9332-49a624485318.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    },
    CapacitorSim: {
      permissions: ['telephony']
    }
  },
  android: {
    permissions: [
      'android.permission.READ_PHONE_STATE',
      'android.permission.READ_PHONE_NUMBERS',
      'android.permission.ACCESS_NETWORK_STATE'
    ]
  },
  ios: {
    permissions: [
      'NSContactsUsageDescription'
    ]
  }
};

export default config;
