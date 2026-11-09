import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/question_feedback_repository.dart';
import '../../../domain/models/question_feedback_model.dart';
import '../../auth/providers/auth_provider.dart';

final questionFeedbackRepositoryProvider = Provider<QuestionFeedbackRepository>(
  (ref) {
    return QuestionFeedbackRepository();
  },
);

final adminFeedbacksProvider = StreamProvider<List<QuestionFeedbackModel>>((
  ref,
) {
  final repository = ref.watch(questionFeedbackRepositoryProvider);
  return repository.getAdminFeedbacks();
});

final studentFeedbacksProvider =
    StreamProvider.autoDispose<List<QuestionFeedbackModel>>((ref) {
      final user = ref.watch(authStateProvider).value;
      if (user == null) {
        return Stream.value([]);
      }
      final repository = ref.watch(questionFeedbackRepositoryProvider);
      return repository.getStudentFeedbacks(user.id);
    });

class QuestionFeedbackNotifier extends AsyncNotifier<void> {
  late final QuestionFeedbackRepository _repository;

  @override
  FutureOr<void> build() {
    _repository = ref.watch(questionFeedbackRepositoryProvider);
  }

  Future<void> submitFeedback(QuestionFeedbackModel feedback) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repository.addFeedback(feedback));
  }

  Future<void> replyToFeedback(
    String feedbackId,
    String reply, {
    String? adminReplyImageUrl,
    String? adminReplyAudioUrl,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _repository.replyToFeedback(
        feedbackId,
        reply,
        adminReplyImageUrl: adminReplyImageUrl,
        adminReplyAudioUrl: adminReplyAudioUrl,
      ),
    );
  }

  Future<void> markAsReadByAdmin(String feedbackId) async {
    try {
      await _repository.markAsReadByAdmin(feedbackId);
    } catch (e) {
      // Background operation, errors can be ignored safely or logged
    }
  }

  Future<void> markAsReadByStudent(String feedbackId) async {
    try {
      await _repository.markAsReadByStudent(feedbackId);
    } catch (e) {
      // Ignored for now
    }
  }

  Future<void> toggleStar(String feedbackId, bool currentStatus) async {
    try {
      await _repository.toggleStar(feedbackId, currentStatus);
    } catch (e) {
      // Background operation, ignored for now
    }
  }
}

final questionFeedbackNotifierProvider =
    AsyncNotifierProvider<QuestionFeedbackNotifier, void>(() {
      return QuestionFeedbackNotifier();
    });
