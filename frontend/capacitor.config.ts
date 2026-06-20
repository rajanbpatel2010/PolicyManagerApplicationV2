import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.policymanager.app',
  appName: 'Policy Manager',
  webDir: 'dist/policy-manager/browser',
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: "Log in to Policy Manager",
        biometricSubTitle: "Please authenticate to access your data"
      }
    }
  }
};

export default config;
