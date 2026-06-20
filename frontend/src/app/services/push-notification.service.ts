import { Injectable } from '@angular/core';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  constructor(private router: Router, private toast: ToastService) { }

  /**
   * Initialize push notification listeners
   */
  initPush() {
    if (Capacitor.getPlatform() !== 'web') {
      this.registerPush();
    }
  }

  private registerPush() {
    // Request permission to use push notifications
    // iOS will prompt a user for permission out of the box.
    // Android will only prompt for permission if it's targeted for Android 13+.
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // Show some error
        console.warn('Push notification permission denied');
      }
    });

    // On success, we should be able to receive a token
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      // Here you would typically send this token to your backend
      // to associate it with the current user.
      localStorage.setItem('fcm_token', token.value);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      const message = `${notification.title}: ${notification.body}`;
      this.toast.info(message);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      const data = notification.notification.data;
      if (data && data.policyId) {
        this.router.navigate(['/policies', data.policyId]);
      }
    });
  }
}
