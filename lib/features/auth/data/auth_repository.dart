import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/models/user_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(FirebaseAuth.instance, FirebaseFirestore.instance);
});

class AuthRepository {
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  AuthRepository(this._auth, this._firestore);

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  Future<UserModel?> getCurrentUserData() async {
    final user = _auth.currentUser;
    if (user != null) {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        return UserModel.fromJson(doc.data()!);
      }
    }
    return null;
  }

  Future<UserModel> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    final cleanEmail = email.trim().toLowerCase();
    final credential = await _auth.signInWithEmailAndPassword(
      email: cleanEmail,
      password: password,
    );

    final doc = await _firestore
        .collection('users')
        .doc(credential.user!.uid)
        .get();
    if (doc.exists) {
      return UserModel.fromJson(doc.data()!);
    } else {
      throw Exception('بيانات الطالب غير موجودة في قاعدة البيانات');
    }
  }

  Future<UserModel> registerWithEmailAndPassword(
    String email,
    String password,
    String name,
  ) async {
    final cleanEmail = email.trim().toLowerCase();

    // 1. فحص صارم لعدم تكرار اسم المستخدم أو البريد بين الطلاب
    final existingUserQuery = await _firestore
        .collection('users')
        .where('email', isEqualTo: cleanEmail)
        .limit(1)
        .get();

    if (existingUserQuery.docs.isNotEmpty) {
      throw Exception(
        'اسم المستخدم أو البريد هذا محجوز مسبقاً لطالب آخر. يرجى اختيار اسم مستخدم مختلف.',
      );
    }

    // 2. إنشاء الحساب في Firebase Auth
    final credential = await _auth.createUserWithEmailAndPassword(
      email: cleanEmail,
      password: password,
    );

    final userModel = UserModel(
      id: credential.user!.uid,
      email: cleanEmail,
      name: name.trim(),
      role: UserRole.student,
    );

    // 3. حفظ بيانات الطالب الفريدة في Firestore
    await _firestore
        .collection('users')
        .doc(credential.user!.uid)
        .set(userModel.toJson());

    return userModel;
  }

  Future<void> updateUserProfile(UserModel user) async {
    await _firestore.collection('users').doc(user.id).update(user.toJson());
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('لم يتم تسجيل الدخول');
    }
    if (user.email != null) {
      final cred = EmailAuthProvider.credential(
        email: user.email!,
        password: currentPassword,
      );
      await user.reauthenticateWithCredential(cred);
    }
    await user.updatePassword(newPassword);
  }

  Future<void> sendPasswordReset(String email) async {
    await _auth.sendPasswordResetEmail(email: email.trim().toLowerCase());
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
