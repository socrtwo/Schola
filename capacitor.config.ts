import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scholaapp.schola',
  appName: 'Schola',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e3a5f',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1e3a5f',
    },
  },
  android: {
    buildOptions: {
      keystorePath: 'schola.keystore',
      keystoreAlias: 'schola',
    },
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
