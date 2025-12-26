/**
 * Push Notification Service
 * Handles material distribution notifications for farmers
 */

import { Platform } from 'react-native';
// Note: You'll need to install these packages:
// npm install expo-notifications expo-device expo-constants

// Uncomment when packages are installed:
/*
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('material-distribution', {
      name: 'Material Distribution',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2E7D32',
    });

    await Notifications.setNotificationChannelAsync('material-reminder', {
      name: 'Material Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2E7D32',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Push notification token:', token);
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

// Setup material distribution notification listeners
export function setupMaterialDistributionNotifications(
  onNotificationReceived?: (notification: any) => void
) {
  // Listen for notifications when app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    const data = notification.request.content.data;
    
    if (data?.type === 'MATERIAL_DISTRIBUTION') {
      console.log('Material distribution notification received:', data);
      onNotificationReceived?.(notification);
    }
  });

  // Listen for notification taps
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'MATERIAL_DISTRIBUTION') {
      console.log('Material distribution notification tapped:', data);
      // Navigate to material receipts screen
      // This would typically use your navigation system
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

// Schedule daily reminder for pending confirmations
export async function scheduleDailyMaterialReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule daily reminder at 6 PM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Nhắc nhở xác nhận vật liệu',
      body: 'Bạn có vật liệu đang chờ xác nhận',
      data: { type: 'MATERIAL_REMINDER' },
      sound: true,
    },
    trigger: {
      hour: 18,
      minute: 0,
      repeats: true,
    },
  });
}

// Show local notification for new material distribution
export async function showMaterialDistributionNotification(
  materialName: string,
  quantity: number,
  unit: string,
  deadline: string
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📦 Vật liệu mới đã được giao',
      body: `${materialName} (${quantity} ${unit}) - Xác nhận trước ${deadline}`,
      data: { type: 'MATERIAL_DISTRIBUTION' },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Show immediately
  });
}
*/

// Placeholder functions when packages are not installed
export async function registerForPushNotificationsAsync() {
  console.log('Push notifications not configured. Install expo-notifications to enable.');
  return null;
}

export function setupMaterialDistributionNotifications(
  onNotificationReceived?: (notification: any) => void
) {
  console.log('Push notifications not configured. Install expo-notifications to enable.');
  return () => {};
}

export async function scheduleDailyMaterialReminder() {
  console.log('Push notifications not configured. Install expo-notifications to enable.');
}

export async function showMaterialDistributionNotification(
  materialName: string,
  quantity: number,
  unit: string,
  deadline: string
) {
  console.log('Push notifications not configured. Install expo-notifications to enable.');
  console.log(`Would show: ${materialName} (${quantity} ${unit}) - Deadline: ${deadline}`);
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * To enable push notifications, follow these steps:
 * 
 * 1. Install required packages:
 *    npm install expo-notifications expo-device expo-constants
 * 
 * 2. Configure app.json/app.config.js:
 *    {
 *      "expo": {
 *        "plugins": [
 *          [
 *            "expo-notifications",
 *            {
 *              "icon": "./assets/notification-icon.png",
 *              "color": "#2E7D32",
 *              "sounds": ["./assets/notification-sound.wav"]
 *            }
 *          ]
 *        ],
 *        "notification": {
 *          "icon": "./assets/notification-icon.png",
 *          "color": "#2E7D32",
 *          "androidMode": "default",
 *          "androidCollapsedTitle": "Material Distribution"
 *        }
 *      }
 *    }
 * 
 * 3. For Android, create notification icons:
 *    - Create a 96x96 white icon with transparent background
 *    - Save as assets/notification-icon.png
 * 
 * 4. Uncomment the implementation code above
 * 
 * 5. Call registerForPushNotificationsAsync() in your App.tsx or main component:
 *    useEffect(() => {
 *      registerForPushNotificationsAsync();
 *      const cleanup = setupMaterialDistributionNotifications();
 *      return cleanup;
 *    }, []);
 * 
 * 6. Backend Integration:
 *    - Send the push token to your backend
 *    - Backend should send notifications when:
 *      a. Supervisor confirms material distribution
 *      b. 1 day before farmer confirmation deadline
 *      c. On deadline day
 *      d. When overdue
 * 
 * 7. Notification Payload Format (from backend):
 *    {
 *      "to": "ExponentPushToken[...]",
 *      "title": "📦 New Material Delivered",
 *      "body": "NPK Fertilizer (50 kg) - Confirm by 2024-12-28",
 *      "data": {
 *        "type": "MATERIAL_DISTRIBUTION",
 *        "materialDistributionId": "uuid",
 *        "materialName": "NPK Fertilizer",
 *        "quantity": 50,
 *        "deadline": "2024-12-28"
 *      },
 *      "sound": "default",
 *      "priority": "high",
 *      "channelId": "material-distribution"
 *    }
 */

