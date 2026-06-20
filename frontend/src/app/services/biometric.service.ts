import { Injectable } from '@angular/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private readonly STORAGE_KEY = 'biometric_credentials';

  constructor() {}

  /**
   * Check if biometrics are available on the device
   */
  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch (error) {
      console.error('Biometric availability check failed', error);
      return false;
    }
  }

  /**
   * Perform biometric authentication
   */
  async authenticate(): Promise<boolean> {
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Sign in to PolicyManager',
        title: 'Biometric Login',
        subtitle: 'Use your fingerprint or face to continue',
        description: 'Please authenticate to access your account securely.',
        negativeButtonText: 'Cancel',
      });
      return true;
    } catch (error) {
      console.error('Biometric authentication failed', error);
      return false;
    }
  }

  /**
   * Securely store credentials associated with biometrics
   */
  async setCredentials(email: string, password: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: 'policymanager.app',
      });
      localStorage.setItem('has_biometric', 'true');
    } catch (error) {
      console.error('Failed to set biometric credentials', error);
    }
  }

  /**
   * Retrieve credentials after successful biometric authentication
   */
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    if (!Capacitor.isNativePlatform()) return null;

    try {
      const result = await NativeBiometric.getCredentials({
        server: 'policymanager.app',
      });
      return {
        username: result.username,
        password: result.password
      };
    } catch (error) {
      console.error('Failed to get biometric credentials', error);
      return null;
    }
  }

  /**
   * Clear biometric credentials
   */
  async clearCredentials(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await NativeBiometric.deleteCredentials({
        server: 'policymanager.app',
      });
      localStorage.removeItem('has_biometric');
    } catch (error) {
      console.error('Failed to delete biometric credentials', error);
    }
  }

  /**
   * Check if the user has biometric login enabled
   */
  hasBiometricEnabled(): boolean {
    return localStorage.getItem('has_biometric') === 'true';
  }
}
