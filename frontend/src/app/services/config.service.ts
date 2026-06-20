import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly STORAGE_KEY = 'api_url_override';
  // Fallback IP for mobile when no override is present and environment is relative
  private readonly MOBILE_FALLBACK_IP = 'http://192.168.1.10:5000/api';

  constructor() { }

  /**
   * Get the current API URL (stored override or smart default)
   */
  getApiUrl(): string {
    const override = localStorage.getItem(this.STORAGE_KEY);
    if (override) return override;

    const envUrl = environment.apiUrl;

    // If we are on mobile and the URL is relative, use a fallback or window.location
    if (Capacitor.isNativePlatform() && (envUrl.startsWith('/') || envUrl.includes('localhost'))) {
      return this.MOBILE_FALLBACK_IP;
    }

    return envUrl;
  }

  /**
   * Set a new API URL override
   */
  setApiUrl(url: string): void {
    if (!url) {
      localStorage.removeItem(this.STORAGE_KEY);
      return;
    }
    
    // Ensure URL ends with /api
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl += '/api';
    }
    
    // Ensure protocol
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'http://' + cleanUrl;
    }
    
    localStorage.setItem(this.STORAGE_KEY, cleanUrl);
  }

  /**
   * Reset to default environment URL
   */
  resetToDefault(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
