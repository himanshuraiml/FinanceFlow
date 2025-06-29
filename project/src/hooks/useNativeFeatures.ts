import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SMSMessage } from '../types';

declare global {
  interface Window {
    AndroidPermissions: any;
    addEventListener: any;
  }
}

export const useNativeFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [hasStoragePermission, setHasStoragePermission] = useState(false);
  const [hasSMSPermission, setHasSMSPermission] = useState(false);
  const [permissionsRequested, setPermissionsRequested] = useState(false);

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    setIsNative(isNativePlatform);

    if (isNativePlatform) {
      // Set status bar style
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#0f172a' });

      // Listen for permission results from native layer
      window.addEventListener('permissionsResult', (event: any) => {
        const permissions = JSON.parse(event.detail || event);
        setHasStoragePermission(
          permissions['android.permission.WRITE_EXTERNAL_STORAGE'] || 
          permissions['android.permission.READ_EXTERNAL_STORAGE'] || 
          false
        );
        setHasSMSPermission(permissions['android.permission.READ_SMS'] || false);
        setPermissionsRequested(true);
      });

      // Check current permissions
      checkAllPermissions();

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      // Handle back button
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    } else {
      // For web, storage is always available, SMS is not
      setHasStoragePermission(true);
      setHasSMSPermission(false);
      setPermissionsRequested(true);
    }

    return () => {
      if (isNativePlatform) {
        App.removeAllListeners();
      }
    };
  }, []);

  const checkAllPermissions = async () => {
    if (!isNative) return;

    try {
      // Check storage permission
      const storageResult = await checkPermission('android.permission.WRITE_EXTERNAL_STORAGE');
      setHasStoragePermission(storageResult);

      // Check SMS permission
      const smsResult = await checkPermission('android.permission.READ_SMS');
      setHasSMSPermission(smsResult);

      setPermissionsRequested(true);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionsRequested(true);
    }
  };

  const checkPermission = async (permission: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.AndroidPermissions) {
        window.AndroidPermissions.checkPermission(
          { permission },
          (result: any) => resolve(result.hasPermission),
          () => resolve(false)
        );
      } else {
        resolve(false);
      }
    });
  };

  const requestPermission = async (permission: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.AndroidPermissions) {
        window.AndroidPermissions.requestPermission(
          { permission },
          (result: any) => resolve(result.hasPermission),
          () => resolve(false)
        );
      } else {
        resolve(false);
      }
    });
  };

  const triggerHaptic = (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      Haptics.impact({ style });
    }
  };

  const readSMSMessages = async (): Promise<SMSMessage[]> => {
    if (!isNative || !hasSMSPermission) {
      return [];
    }

    return new Promise((resolve) => {
      if (window.AndroidPermissions) {
        window.AndroidPermissions.readSMSMessages(
          {},
          (result: any) => {
            const messages = result.messages || [];
            resolve(messages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender,
              timestamp: new Date(msg.timestamp).toISOString()
            })));
          },
          (error: any) => {
            console.error('Error reading SMS:', error);
            resolve([]);
          }
        );
      } else {
        resolve([]);
      }
    });
  };

  return {
    isNative,
    hasStoragePermission,
    hasSMSPermission,
    permissionsRequested,
    triggerHaptic,
    requestPermission,
    readSMSMessages
  };
};