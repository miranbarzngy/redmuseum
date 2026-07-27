package com.amnaka.admin;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerFCMToken();
    }

    private void registerFCMToken() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful() || task.getResult() == null) return;
                String token = task.getResult();
                new Thread(() -> saveToken(token)).start();
            });
    }

    private void saveToken(String token) {
        try {
            URL url = new URL("https://redmuseum.vercel.app/api/admin/register-fcm");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);

            String safe = token.replace("\\", "\\\\").replace("\"", "\\\"");
            String body = "{\"token\":\"" + safe + "\"}";
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
            }
            conn.getResponseCode();
            conn.disconnect();
        } catch (Exception ignored) {}
    }
}
