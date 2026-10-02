package com.amnaka.admin;

import android.annotation.SuppressLint;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Helps admin pushes survive battery optimisation and OEM background killers
 * (Xiaomi, Huawei, Oppo/Vivo, Samsung…). FCM high-priority messages already
 * bypass Doze, but these vendors additionally block delivery to apps they
 * consider "unused" or that were swiped away — the user has to whitelist the
 * app by hand. This plugin reports the current state and deep-links into the
 * right settings screens.
 *
 * Registered in {@link MainActivity#onCreate}. JS side: src/lib/nativeBackgroundDelivery.ts.
 */
@CapacitorPlugin(name = "BackgroundDelivery")
public class BackgroundDeliveryPlugin extends Plugin {

    // Vendor "autostart" / "protected apps" screens. Tried in order; the
    // first one that resolves on this device wins.
    private static final ComponentName[] AUTOSTART_COMPONENTS = {
        new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"),
        new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"),
        new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"),
        new ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"),
        new ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"),
        new ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"),
        new ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"),
        new ComponentName("com.letv.android.letvsafe", "com.letv.android.letvsafe.AutobootManageActivity"),
        new ComponentName("com.asus.mobilemanager", "com.asus.mobilemanager.MainActivity"),
        new ComponentName("com.samsung.android.lool", "com.samsung.android.sm.battery.ui.BatteryActivity"),
    };

    @PluginMethod
    public void getStatus(PluginCall call) {
        Context ctx = getContext();
        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        boolean ignoring = Build.VERSION.SDK_INT < Build.VERSION_CODES.M
            || (pm != null && pm.isIgnoringBatteryOptimizations(ctx.getPackageName()));

        JSObject ret = new JSObject();
        ret.put("ignoringBatteryOptimizations", ignoring);
        ret.put("notificationsEnabled", NotificationManagerCompat.from(ctx).areNotificationsEnabled());
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("hasAutostartScreen", findAutostartIntent() != null);
        call.resolve(ret);
    }

    /** System dialog "Let app always run in background?" (allow / deny). */
    @SuppressLint("BatteryLife") // Sideloaded, not on Play — policy doesn't apply.
    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            call.resolve();
            return;
        }
        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            .setData(Uri.parse("package:" + getContext().getPackageName()));
        if (!tryStart(intent)) {
            tryStart(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
        }
        call.resolve();
    }

    /** Vendor autostart screen if one exists, else this app's system settings page. */
    @PluginMethod
    public void openAutostartSettings(PluginCall call) {
        Intent intent = findAutostartIntent();
        if (intent == null || !tryStart(intent)) {
            tryStart(appDetailsIntent());
        }
        call.resolve();
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Intent intent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
        } else {
            intent = appDetailsIntent();
        }
        if (!tryStart(intent)) tryStart(appDetailsIntent());
        call.resolve();
    }

    private Intent findAutostartIntent() {
        PackageManager pm = getContext().getPackageManager();
        for (ComponentName component : AUTOSTART_COMPONENTS) {
            Intent intent = new Intent().setComponent(component);
            if (pm.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY) != null) return intent;
        }
        return null;
    }

    private Intent appDetailsIntent() {
        return new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            .setData(Uri.parse("package:" + getContext().getPackageName()));
    }

    private boolean tryStart(Intent intent) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
