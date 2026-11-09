import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../domain/models/question_feedback_model.dart';

class QuestionFeedbackRepository {
  final FirebaseFirestore _firestore;

  QuestionFeedbackRepository({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> get _feedbacks =>
      _firestore.collection('question_feedbacks');

  Future<void> addFeedback(QuestionFeedbackModel feedback) async {
    await _feedbacks.doc(feedback.id).set(feedback.toJson());
  }

  Stream<List<QuestionFeedbackModel>> getAdminFeedbacks() {
    return _feedbacks.snapshots().map((snapshot) {
      final list = snapshot.docs
          .map((doc) => QuestionFeedbackModel.fromJson(doc.data()))
          .toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    });
  }

  Stream<List<QuestionFeedbackModel>> getStudentFeedbacks(String userId) {
    return _feedbacks
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map((snapshot) {
          final list = snapshot.docs
              .map((doc) => QuestionFeedbackModel.fromJson(doc.data()))
              .toList();
          list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          return list;
        });
  }

  Future<void> replyToFeedback(
    String feedbackId,
    String reply, {
    String? adminReplyImageUrl,
    String? adminReplyAudioUrl,
  }) async {
    final Map<String, dynamic> data = {
      'adminReply': reply,
      'isReadByAdmin': true,
      'isReadByStudent': false, // Student hasn't read the reply yet
    };
    if (adminReplyImageUrl != null && adminReplyImageUrl.isNotEmpty) {
      data['adminReplyImageUrl'] = adminReplyImageUrl;
    }
    if (adminReplyAudioUrl != null && adminReplyAudioUrl.isNotEmpty) {
      data['adminReplyAudioUrl'] = adminReplyAudioUrl;
    }
    await _feedbacks.doc(feedbackId).update(data);
  }

  Future<void> markAsReadByAdmin(String feedbackId) async {
    await _feedbacks.doc(feedbackId).update({'isReadByAdmin': true});
  }

  Future<void> markAsReadByStudent(String feedbackId) async {
    await _feedbacks.doc(feedbackId).update({'isReadByStudent': true});
  }

  Future<void> toggleStar(String feedbackId, bool currentStatus) async {
    await _feedbacks.doc(feedbackId).update({'isStarred': !currentStatus});
  }
}
