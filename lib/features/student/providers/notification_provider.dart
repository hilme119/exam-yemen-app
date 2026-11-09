import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../domain/models/notification_model.dart';
import '../../auth/providers/auth_provider.dart';

final notificationsProvider = StreamProvider.autoDispose<List<NotificationModel>>((
  ref,
) {
  // We only fetch notifications if the user is logged in
  final authState = ref.watch(authStateProvider);
  // AuthStateProvider yields an AsyncValue<UserModel?> in some setups, we need to check .value
  if (!authState.hasValue || authState.value == null) {
    return Stream.value([]);
  }

  // Fetch from the 'notifications' collection where topic is 'all_students'
  return FirebaseFirestore.instance
      .collection('notifications')
      // If we eventually add specific user notifications, we'd query by userId or topic
      // .where('topic', isEqualTo: 'all_students') // Omit filter for now, fetch all global notifications
      .orderBy('timestamp', descending: true)
      .snapshots()
      .map((snapshot) {
        return snapshot.docs
            .map((doc) => NotificationModel.fromJson(doc.data(), doc.id))
            .toList();
      });
});
