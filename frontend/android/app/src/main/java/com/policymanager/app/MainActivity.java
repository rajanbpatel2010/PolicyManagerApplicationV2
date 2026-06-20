package com.policymanager.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.getcapacitor.community.database.sqlite.CapacitorSQLitePlugin;
import ee.forgr.biometric.NativeBiometric;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                // Try default initialization (requires google-services.json)
                FirebaseApp.initializeApp(this);
                Log.d("MainActivity", "Firebase initialized automatically.");
            }
        } catch (Exception e) {
            Log.e("MainActivity", "Default Firebase initialization failed", e);
        }

        // Ensure Firebase is initialized before any plugin might use it
        if (FirebaseApp.getApps(this).isEmpty()) {
            try {
                // Manual fallback with dummy values to prevent crashing
                // NOTE: Replace these with actual values from Firebase Console for Push to work
                FirebaseOptions options = new FirebaseOptions.Builder()
                    .setApiKey("AIzaSyA-dummy-key")
                    .setApplicationId("1:1234567890:android:abcdef123456")
                    .setProjectId("policy-manager-dummy")
                    .setGcmSenderId("1234567890")
                    .build();
                FirebaseApp.initializeApp(this, options);
                Log.d("MainActivity", "Firebase initialized with manual fallback.");
            } catch (Exception ex) {
                Log.e("MainActivity", "Firebase manual initialization also failed", ex);
            }
        }

        super.onCreate(savedInstanceState);
        
        // Explicitly register problematic plugins
        registerPlugin(CapacitorSQLitePlugin.class);
        registerPlugin(NativeBiometric.class);
        registerPlugin(PushNotificationsPlugin.class);
    }
}
