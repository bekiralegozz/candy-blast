import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bekiralegozz.royalblast',
  appName: 'Royal Blast',
  webDir: 'dist',
  ios: {
    scheme: 'Royal Blast',
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0d1f33',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0d1f33',
    },
  },
};

export default config;
