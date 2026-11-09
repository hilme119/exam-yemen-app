import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/firebase_messaging_service.dart';
import '../../../domain/models/user_model.dart';
import '../data/auth_repository.dart';

final authStateProvider = AsyncNotifierProvider<AuthNotifier, UserModel?>(() {
  return AuthNotifier();
});

class AuthNotifier extends AsyncNotifier<UserModel?> {
  late AuthRepository _authRepository;

  @override
  FutureOr<UserModel?> build() async {
    _authRepository = ref.watch(authRepositoryProvider);
    UserModel? user;
    try {
      user = await _authRepository.getCurrentUserData();
    } catch (_) {}

    if (user == null) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final raw = prefs.getString('logged_in_user_data');
        if (raw != null) {
          user = UserModel.fromJson(jsonDecode(raw));
        }
      } catch (_) {}
    }

    if (user != null) {
      _initializeMessagingForUser(user);
    }
    return user;
  }

  void _initializeMessagingForUser(UserModel user) async {
    try {
      final fcmService = FirebaseMessagingService();
      if (user.role == UserRole.student) {
        await fcmService.subscribeToTopic('all_students');
      } else if (user.role == UserRole.admin) {
        await fcmService.subscribeToTopic('admins');
      }
      await fcmService.saveTokenToDatabase(user.id);
    } catch (e) {
      debugPrint('Error initializing FCM for loaded user: $e');
    }
  }

  Future<void> login(String loginInput, String password) async {
    state = const AsyncLoading();
    try {
      final processedInput = loginInput.replaceAll(RegExp(r'\s+'), '').toLowerCase();
      final email = processedInput.contains('@')
          ? processedInput
          : '$processedInput@examyemen.com';
      final user = await _authRepository.signInWithEmailAndPassword(
        email,
        password,
      );

      final fcmService = FirebaseMessagingService();
      if (user.role == UserRole.student) {
        await fcmService.subscribeToTopic('all_students');
      } else if (user.role == UserRole.admin) {
        await fcmService.subscribeToTopic('admins');
      }
      await fcmService.saveTokenToDatabase(user.id);

      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('logged_in_user_id', user.id);
        await prefs.setString('logged_in_user_data', jsonEncode(user.toJson()));
        await prefs.setBool('isFirstLaunch', false);
      } catch (_) {}

      state = AsyncData(user);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> register(String loginInput, String password, String name) async {
    state = const AsyncLoading();
    try {
      final processedInput = loginInput.replaceAll(RegExp(r'\s+'), '').toLowerCase();
      final email = processedInput.contains('@')
          ? processedInput
          : '$processedInput@examyemen.com';
      final user = await _authRepository.registerWithEmailAndPassword(
        email,
        password,
        name,
      );

      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('logged_in_user_id', user.id);
        await prefs.setString('logged_in_user_data', jsonEncode(user.toJson()));
        await prefs.setBool('isFirstLaunch', false);
      } catch (_) {}

      state = AsyncData(user);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    try {
      final currentUser = state.value;
      if (currentUser?.role == UserRole.student) {
        try {
          await FirebaseMessagingService().unsubscribeFromTopic('all_students');
        } catch (_) {}
      } else if (currentUser?.role == UserRole.admin) {
        try {
          await FirebaseMessagingService().unsubscribeFromTopic('admins');
        } catch (_) {}
      }

      await _authRepository.signOut();

      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('logged_in_user_id');
        await prefs.remove('logged_in_user_data');
      } catch (_) {}

      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> updateUserProfile(UserModel updatedUser) async {
    if (state.value == null) return;
    state = const AsyncLoading();
    try {
      await _authRepository.updateUserProfile(updatedUser);
      state = AsyncData(updatedUser);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _authRepository.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
  }

  Future<void> sendPasswordReset(String email) async {
    await _authRepository.sendPasswordReset(email);
  }
}
