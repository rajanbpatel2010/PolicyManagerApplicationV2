import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastComponent } from './components/toast/toast.component';
import { CommandPaletteComponent } from './components/shared/command-palette/command-palette.component';
import { PushNotificationService } from './services/push-notification.service';
import { OfflineStorageService } from './services/offline-storage.service';
import { Capacitor } from '@capacitor/core';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, ToastComponent, CommandPaletteComponent],
    template: `
    <app-navbar />
    <main>
      <router-outlet />
    </main>
    <app-toast />
    <app-command-palette />
  `,
    styles: [`
    main {
      padding-top: 100px; /* navbar height + significant breathing room */
      min-height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
    title = 'Policy Manager';

    constructor(
        private pushService: PushNotificationService,
        private offlineStorage: OfflineStorageService
    ) { }

    async ngOnInit() {
        if (Capacitor.isNativePlatform()) {
            // Wait slightly for native bridge
            setTimeout(async () => {
                await this.offlineStorage.initDb();
                this.pushService.initPush();
            }, 1000);
        }
    }
}
