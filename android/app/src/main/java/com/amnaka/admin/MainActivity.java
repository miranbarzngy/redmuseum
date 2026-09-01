package com.amnaka.admin;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local (non-npm) plugins have to be registered by hand, before the
        // bridge spins up. npm plugins keep auto-registering via
        // capacitor.plugins.json.
        registerPlugin(ApkUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
