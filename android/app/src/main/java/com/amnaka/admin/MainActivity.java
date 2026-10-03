package com.amnaka.admin;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** Must match ADMIN_PUSH_CHANNEL_ID in src/lib/adminPush.ts. */
    public static final String ADMIN_ALERTS_CHANNEL_ID = "admin_alerts";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local (non-npm) plugins have to be registered by hand, before the
        // bridge spins up. npm plugins keep auto-registering via
        // capacitor.plugins.json.
        registerPlugin(ApkUpdaterPlugin.class);
        registerPlugin(BackgroundDeliveryPlugin.class);
        super.onCreate(savedInstanceState);
        createAdminAlertsChannel();
    }

    /**
     * High-importance channel for booking / message pushes, so they show as
     * heads-up with sound instead of landing silently in FCM's default
     * "Miscellaneous" channel. Idempotent — re-creating an existing channel
     * is a no-op.
     */
    private void createAdminAlertsChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationChannel channel = new NotificationChannel(
            ADMIN_ALERTS_CHANNEL_ID,
            "Bookings & messages",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("New visit requests and contact messages");
        channel.enableVibration(true);
        // Private, not public: a phone set to hide sensitive lock-screen
        // content shows that a push arrived without the visitor's details.
        channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE);
        channel.setSound(
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
            new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
        );

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) manager.createNotificationChannel(channel);
    }
}
