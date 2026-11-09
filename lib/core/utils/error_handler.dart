import 'package:flutter/material.dart';

class ErrorHandler {
  static void showErrorSnackBar(BuildContext context, dynamic error) {
    if (!context.mounted) return;

    final errorMessage = _translateError(error.toString());

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                errorMessage,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.red.shade800,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  static String getErrorMessage(dynamic error) {
    if (error == null) return 'حدث خطأ غير متوقع';
    return _translateError(error.toString());
  }

  static String _translateError(String error) {
    final lowerError = error.toLowerCase();

    // Auth Errors
    if (lowerError.contains('user-not-found') ||
        lowerError.contains('invalid-credential') ||
        lowerError.contains('wrong-password')) {
      return 'البريد الإلكتروني أو اسم المستخدم، أو كلمة المرور غير صحيحة.';
    } else if (lowerError.contains('invalid-email')) {
      return 'صيغة البريد الإلكتروني أو اسم المستخدم غير صحيحة. لا تستخدم مسافات أو حروف عربية.';
    } else if (lowerError.contains('email-already-in-use')) {
      return 'اسم المستخدم أو الحساب هذا محجوز مسبقاً لطالب آخر. يرجى اختيار اسم مستخدم مختلف.';
    } else if (lowerError.contains('weak-password')) {
      return 'كلمة المرور ضعيفة جداً. يرجى اختيار كلمة لا تقل عن 6 أحرف.';
    }
    // Network & Platform Errors
    else if (lowerError.contains('network') ||
        lowerError.contains('unavailable') ||
        lowerError.contains('failed host lookup') ||
        lowerError.contains('offline')) {
      return 'عذراً، لا يوجد اتصال بالإنترنت أو الخدمة غير متوفرة حالياً. يرجى التحقق من الشبكة.';
    }
    // Permission & Firebase Errors
    else if (lowerError.contains('permission-denied') ||
        lowerError.contains('missing or insufficient permissions')) {
      return 'عفواً، ليس لديك صلاحية للقيام بهذه العملية.';
    } else if (lowerError.contains('canceled') ||
        lowerError.contains('cancelled')) {
      return 'تم إلغاء العملية.';
    }

    // Clean standard Exception message prefix if present
    if (error.startsWith('Exception: ')) {
      return error.substring(11);
    }

    // Fallback
    return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  }
}
