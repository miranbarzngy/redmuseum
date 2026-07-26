import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amnasuraka.admin',
  appName: 'ئەمنە سورەکە ئەدمین',
  webDir: 'www',
  server: {
    // Points to the live admin dashboard — no separate web build needed
    url: 'https://redmuseum.vercel.app/admin',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    backgroundColor: '#0a0a0a',
  },
};

export default config;
