import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class FirebaseMessagingService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static bool _localNotificationsInitialized = false;

  Future<void> initialize() async {
    // Request permission for iOS/Web
    if (kIsWeb || defaultTargetPlatform == TargetPlatform.iOS) {
      NotificationSettings settings = await _firebaseMessaging
          .requestPermission(alert: true, badge: true, sound: true);

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('User granted permission');
      } else {
        debugPrint('User declined or has not accepted permission');
        return;
      }
    } else {
      // Android 13+ asks at runtime, older versions grant automatically
      await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
    }

    // Initialize local notifications for foreground display
    if (!kIsWeb) {
      try {
        await _initLocalNotifications();
      } catch (e) {
        debugPrint('Failed to initialize local notifications: $e');
      }
    }

    // Handle token updates
    _firebaseMessaging.getToken().then((token) {
      if (token != null) {
        debugPrint('FCM Token: $token');
        // We don't save it here globally since we need a userId.
        // Saving is deferred to the AuthProvider / login flow.
      }
    });

    _firebaseMessaging.onTokenRefresh.listen((token) {
      debugPrint('FCM Token Refreshed: $token');
      // Token refresh handled by listening to state elsewhere if needed
    });

    // Foreground messages - show as local notification
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Got a message whilst in the foreground!');
      debugPrint('Message data: ${message.data}');

      if (message.notification != null) {
        debugPrint(
          'Message also contained a notification: ${message.notification}',
        );
        // Show local notification so the user sees it even when app is open
        _showLocalNotification(message);
      }
    });

    // Handle notification tap when app is in background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('Notification tapped (from background): ${message.data}');
      // Navigation can be handled here if needed
    });
  }

  /// Initialize flutter_local_notifications for heads-up display
  Future<void> _initLocalNotifications() async {
    if (_localNotificationsInitialized) return;

    // Android notification channel
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'examyemen_notifications', // channel id
      'إشعارات التطبيق', // channel name
      description: 'إشعارات الاختبارات والتحديثات الجديدة',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );

    // Create the channel on Android
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // Android settings
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS settings
    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        debugPrint('Local notification tapped: ${response.payload}');
        // Handle notification tap if needed
      },
    );

    _localNotificationsInitialized = true;
    debugPrint('Local notifications initialized');
  }

  /// Show a local notification when a FCM message arrives in the foreground
  Future<void> _showLocalNotification(RemoteMessage message) async {
    if (kIsWeb) return;

    final notification = message.notification;
    if (notification == null) return;

    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'examyemen_notifications', // must match channel id
      'إشعارات التطبيق',
      channelDescription: 'إشعارات الاختبارات والتحديثات الجديدة',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
      styleInformation: BigTextStyleInformation(''),
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      notification.hashCode, // unique id
      notification.title ?? 'إشعار جديد',
      notification.body ?? '',
      details,
      payload: message.data.toString(),
    );
  }

  Future<void> subscribeToTopic(String topic) async {
    if (kIsWeb) return;
    await _firebaseMessaging.subscribeToTopic(topic);
    debugPrint('Subscribed to topic: $topic');
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    if (kIsWeb) return;
    await _firebaseMessaging.unsubscribeFromTopic(topic);
    debugPrint('Unsubscribed from topic: $topic');
  }

  Future<void> saveTokenToDatabase(String userId) async {
    try {
      String? token = await _firebaseMessaging.getToken();
      if (token != null) {
        await FirebaseFirestore.instance.collection('users').doc(userId).update(
          {'fcmToken': token, 'tokenUpdatedAt': FieldValue.serverTimestamp()},
        );
        debugPrint('FCM Token updated in users collection for $userId');
      }
    } catch (e) {
      debugPrint('Failed to save FCM token: $e');
    }
  }
}
