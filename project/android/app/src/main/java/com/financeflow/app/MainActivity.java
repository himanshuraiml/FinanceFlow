package com.financeflow.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.database.Cursor;
import android.net.Uri;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "AndroidPermissions")
public class MainActivity extends BridgeActivity {
    
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.READ_SMS,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.READ_EXTERNAL_STORAGE
    };
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the permissions plugin
        registerPlugin(AndroidPermissionsPlugin.class);
        
        // Request permissions on app start
        requestAllPermissions();
    }
    
    private void requestAllPermissions() {
        boolean needsPermissions = false;
        
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                needsPermissions = true;
                break;
            }
        }
        
        if (needsPermissions) {
            ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, PERMISSION_REQUEST_CODE);
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            // Notify the web layer about permission results
            JSObject result = new JSObject();
            for (int i = 0; i < permissions.length; i++) {
                boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
                result.put(permissions[i], granted);
            }
            
            // Send to web layer
            getBridge().triggerWindowJSEvent("permissionsResult", result.toString());
        }
    }
    
    public static class AndroidPermissionsPlugin extends Plugin {
        
        @PluginMethod
        public void checkPermission(PluginCall call) {
            String permission = call.getString("permission");
            if (permission == null) {
                call.reject("Permission parameter is required");
                return;
            }
            
            boolean hasPermission = ContextCompat.checkSelfPermission(
                getContext(), permission) == PackageManager.PERMISSION_GRANTED;
            
            JSObject result = new JSObject();
            result.put("hasPermission", hasPermission);
            call.resolve(result);
        }
        
        @PluginMethod
        public void requestPermission(PluginCall call) {
            String permission = call.getString("permission");
            if (permission == null) {
                call.reject("Permission parameter is required");
                return;
            }
            
            // Check if permission is already granted
            if (ContextCompat.checkSelfPermission(getContext(), permission) 
                == PackageManager.PERMISSION_GRANTED) {
                JSObject result = new JSObject();
                result.put("hasPermission", true);
                call.resolve(result);
                return;
            }
            
            // Save the call for later resolution
            saveCall(call);
            
            // Request the permission
            ActivityCompat.requestPermissions(
                getActivity(), 
                new String[]{permission}, 
                PERMISSION_REQUEST_CODE
            );
        }
        
        @PluginMethod
        public void readSMSMessages(PluginCall call) {
            // Check SMS permission
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) 
                != PackageManager.PERMISSION_GRANTED) {
                call.reject("SMS permission not granted");
                return;
            }
            
            try {
                JSArray messages = new JSArray();
                
                // Query SMS inbox
                Uri uri = Uri.parse("content://sms/inbox");
                String[] projection = {"_id", "address", "body", "date"};
                String selection = "date > ?";
                String[] selectionArgs = {String.valueOf(System.currentTimeMillis() - (30L * 24 * 60 * 60 * 1000))}; // Last 30 days
                String sortOrder = "date DESC LIMIT 100";
                
                Cursor cursor = getContext().getContentResolver().query(
                    uri, projection, selection, selectionArgs, sortOrder);
                
                if (cursor != null) {
                    while (cursor.moveToNext()) {
                        String id = cursor.getString(cursor.getColumnIndexOrThrow("_id"));
                        String address = cursor.getString(cursor.getColumnIndexOrThrow("address"));
                        String body = cursor.getString(cursor.getColumnIndexOrThrow("body"));
                        long date = cursor.getLong(cursor.getColumnIndexOrThrow("date"));
                        
                        // Filter for potential bank SMS
                        if (isFinancialSMS(body, address)) {
                            JSObject message = new JSObject();
                            message.put("id", id);
                            message.put("sender", address);
                            message.put("content", body);
                            message.put("timestamp", new java.util.Date(date).toString());
                            messages.put(message);
                        }
                    }
                    cursor.close();
                }
                
                JSObject result = new JSObject();
                result.put("messages", messages);
                call.resolve(result);
                
            } catch (Exception e) {
                call.reject("Error reading SMS messages: " + e.getMessage());
            }
        }
        
        private boolean isFinancialSMS(String body, String address) {
            if (body == null || address == null) return false;
            
            String lowerBody = body.toLowerCase();
            String lowerAddress = address.toLowerCase();
            
            // Check for bank-related keywords
            return lowerBody.contains("rs") || lowerBody.contains("₹") || 
                   lowerBody.contains("debit") || lowerBody.contains("credit") ||
                   lowerBody.contains("bank") || lowerBody.contains("account") ||
                   lowerBody.contains("transaction") || lowerBody.contains("payment") ||
                   lowerAddress.contains("bank") || lowerAddress.contains("pay") ||
                   lowerAddress.contains("upi") || lowerAddress.contains("wallet");
        }
        
        @Override
        protected void handleOnActivityResult(int requestCode, int resultCode, android.content.Intent data) {
            super.handleOnActivityResult(requestCode, resultCode, data);
            
            if (requestCode == PERMISSION_REQUEST_CODE) {
                PluginCall savedCall = getSavedCall();
                if (savedCall != null) {
                    String permission = savedCall.getString("permission");
                    boolean granted = ContextCompat.checkSelfPermission(
                        getContext(), permission) == PackageManager.PERMISSION_GRANTED;
                    
                    JSObject result = new JSObject();
                    result.put("hasPermission", granted);
                    savedCall.resolve(result);
                }
            }
        }
    }
}